import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock semua dependency model/service - test ini fokus ke business logic
// (perhitungan amount_paid/balanceUsed/extraBalance & urutan pemanggilan),
// bukan integration test ke DB beneran.
vi.mock('../../models/transactionsModel.js', () => ({
  default: { insertTransaction: vi.fn() },
}));
vi.mock('../gallonService.js', () => ({
  default: { getGallonPriceByCustomerId: vi.fn() },
}));
vi.mock('../customerBalanceService.js', () => ({
  default: {
    getCustomerBalanceById: vi.fn(),
    reduceCustomerBalance: vi.fn(),
    updateCustomerBalance: vi.fn(),
  },
}));
vi.mock('../paymentLogService.js', () => ({
  default: { addPaymentLogs: vi.fn() },
}));
vi.mock('../../helpers/logHelper.js', () => ({ default: vi.fn() }));
// withTransaction di-mock jadi passthrough sederhana (langsung jalanin callback-nya
// dgn fake conn) - mekanisme commit/rollback yang sesungguhnya dites terpisah di
// dbTransactionHelper.test.js.
vi.mock('../../helpers/dbTransactionHelper.js', () => ({
  default: vi.fn((callback) => callback({ fakeConn: true })),
}));

import TransactionService from '../transactionsService.js';
import TransactionsModel from '../../models/transactionsModel.js';
import GallonService from '../gallonService.js';
import CustomerBalanceService from '../customerBalanceService.js';
import PaymentLogService from '../paymentLogService.js';
import withTransaction from '../../helpers/dbTransactionHelper.js';

function makeReq(body) {
  return { body, user: { id: 1, role: 'Admin' } };
}

describe('transactionsService.addTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    GallonService.getGallonPriceByCustomerId.mockResolvedValue({
      id: 'gw8',
      price: 8000,
    });
    CustomerBalanceService.getCustomerBalanceById.mockResolvedValue(null); // default: gak ada saldo
    TransactionsModel.insertTransaction.mockResolvedValue(101);
    PaymentLogService.addPaymentLogs.mockResolvedValue({ insertId: 55 });
  });

  it('Tunai: amount_paid otomatis = total_price, gak nyentuh saldo/payment_logs', async () => {
    const req = makeReq({
      customer_id: 1,
      gallon_filled: 5,
      gallon_empty: 5,
      gallon_returned: 0,
      transaction_type: 'Tunai',
      armada_id: 1,
      payment_amount: 0,
    });

    const result = await TransactionService.addTransaction(req);

    expect(result.total_price).toBe(40000); // 8000 * 5
    expect(result.amount_paid).toBe(40000);
    expect(result.transaction_type).toBe('Tunai');
    expect(CustomerBalanceService.reduceCustomerBalance).not.toHaveBeenCalled();
    expect(PaymentLogService.addPaymentLogs).not.toHaveBeenCalled();
  });

  it('Hutang kurang bayar: status tetap Hutang, remaining tercermin dari amount_paid < total_price', async () => {
    const req = makeReq({
      customer_id: 1,
      gallon_filled: 5,
      gallon_empty: 5,
      gallon_returned: 0,
      transaction_type: 'Hutang',
      armada_id: 1,
      payment_amount: 10000,
    });

    const result = await TransactionService.addTransaction(req);

    expect(result.total_price).toBe(40000);
    expect(result.amount_paid).toBe(10000);
    expect(result.transaction_type).toBe('Hutang');
    expect(PaymentLogService.addPaymentLogs).toHaveBeenCalledTimes(1);
    expect(CustomerBalanceService.updateCustomerBalance).not.toHaveBeenCalled();
  });

  it('Hutang bayar pas: otomatis berubah status jadi Tunai', async () => {
    const req = makeReq({
      customer_id: 1,
      gallon_filled: 5,
      gallon_empty: 5,
      gallon_returned: 0,
      transaction_type: 'Hutang',
      armada_id: 1,
      payment_amount: 40000,
    });

    const result = await TransactionService.addTransaction(req);

    expect(result.amount_paid).toBe(40000);
    expect(result.transaction_type).toBe('Tunai');
    // Sudah dianggap Tunai (bukan Hutang) -> gak perlu payment_logs
    expect(PaymentLogService.addPaymentLogs).not.toHaveBeenCalled();
  });

  it('Hutang bayar lebih: extraBalance kekirim ke updateCustomerBalance dgn key `balance` yang bener', async () => {
    const req = makeReq({
      customer_id: 1,
      gallon_filled: 5,
      gallon_empty: 5,
      gallon_returned: 0,
      transaction_type: 'Hutang',
      armada_id: 1,
      payment_amount: 45000, // lebih 5000 dari total_price 40000
    });

    const result = await TransactionService.addTransaction(req);

    expect(result.amount_paid).toBe(45000);
    expect(result.extraBalance).toEqual({ customer_id: 1, balance: 5000 });
    expect(CustomerBalanceService.updateCustomerBalance).toHaveBeenCalledWith(
      req,
      { customer_id: 1, balance: 5000 },
      { fakeConn: true }
    );
  });

  it('Saldo pelanggan yang sudah ada otomatis kepake duluan sebelum payment_amount', async () => {
    CustomerBalanceService.getCustomerBalanceById.mockResolvedValue({ balance: 15000 });

    const req = makeReq({
      customer_id: 1,
      gallon_filled: 5, // total_price 40000
      gallon_empty: 5,
      gallon_returned: 0,
      transaction_type: 'Hutang',
      armada_id: 1,
      payment_amount: 5000,
    });

    const result = await TransactionService.addTransaction(req);

    // amount_paid = balanceUsed(15000) + payment_amount(5000) = 20000
    expect(result.amount_paid).toBe(20000);
    expect(CustomerBalanceService.reduceCustomerBalance).toHaveBeenCalledWith(
      req,
      { customer_id: 1, balanceUsed: 15000 },
      { fakeConn: true }
    );
  });

  it('Kalau salah satu step di dalam withTransaction gagal, step berikutnya gak lanjut & error ke-propagate', async () => {
    TransactionsModel.insertTransaction.mockRejectedValue(new Error('DB error simulasi'));

    const req = makeReq({
      customer_id: 1,
      gallon_filled: 5,
      gallon_empty: 5,
      gallon_returned: 0,
      transaction_type: 'Hutang',
      armada_id: 1,
      payment_amount: 10000,
    });

    await expect(TransactionService.addTransaction(req)).rejects.toThrow('DB error simulasi');

    // insertTransaction gagal duluan -> addPaymentLogs (step setelahnya) gak boleh sempat kepanggil
    expect(PaymentLogService.addPaymentLogs).not.toHaveBeenCalled();
    expect(withTransaction).toHaveBeenCalledTimes(1);
  });

  it('Customer/harga galon gak ketemu -> throw sebelum masuk withTransaction sama sekali', async () => {
    GallonService.getGallonPriceByCustomerId.mockResolvedValue(null);

    const req = makeReq({
      customer_id: 999,
      gallon_filled: 5,
      gallon_empty: 5,
      gallon_returned: 0,
      transaction_type: 'Tunai',
      armada_id: 1,
      payment_amount: 0,
    });

    await expect(TransactionService.addTransaction(req)).rejects.toThrow(
      'Customer or gallon price not found'
    );
    expect(withTransaction).not.toHaveBeenCalled();
  });
});
