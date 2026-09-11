import { describe, it, expect, vi, beforeEach } from 'vitest';

// Cuma model layer & service LAIN (bukan paymentLogService sendiri) yang di-mock -
// `addPaymentLogs` dipanggil dari dalam `payDebt` lewat referensi objek yang sama,
// jadi harus tetap implementasi asli biar alur transaksinya kebaca beneran.
vi.mock('../../models/paymentLogsModel.js', () => ({
  default: {
    getDebtTransactionById: vi.fn(),
    insertPaymentLogs: vi.fn(),
  },
}));
vi.mock('../customerBalanceService.js', () => ({
  default: {
    getCustomerBalanceById: vi.fn(),
    addCustomerBalance: vi.fn(),
    reduceCustomerBalance: vi.fn(),
    updateCustomerBalance: vi.fn(),
  },
}));
vi.mock('../../helpers/logHelper.js', () => ({ default: vi.fn() }));
vi.mock('../../helpers/dbTransactionHelper.js', () => ({
  default: vi.fn((callback) => callback({ fakeConn: true })),
}));

import PaymentLogService from '../paymentLogService.js';
import PaymentLogsModel from '../../models/paymentLogsModel.js';
import CustomerBalanceService from '../customerBalanceService.js';

const req = { user: { id: 1, role: 'Admin' } };

describe('paymentLogService.payDebt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PaymentLogsModel.insertPaymentLogs.mockResolvedValue({ insertId: 200 });
    // Default: pelanggan sudah punya row saldo (0), biar test gak ke-trigger addCustomerBalance
    // kecuali test yang memang mau nguji kasus itu.
    CustomerBalanceService.getCustomerBalanceById.mockResolvedValue({ balance: 0 });
  });

  it('amount_paid string angka ("5000") tetap dihitung bener (bukan digabung teks)', async () => {
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 0,
    });

    const result = await PaymentLogService.payDebt(req, {
      transaction_id: 1,
      amount_paid: '5000', // string, bukan number - simulasi caller non-UI resmi
    });

    // Kalau ke-anggep string ("5000" + 0 saldo), hasilnya bakal beda/error. Harus
    // ke-hitung sbg angka 5000 murni.
    expect(result.remainingDebt).toBe(35000);
  });

  it('amount_paid garbage ("abc") -> ditolak di level service, bukan nyoba dihitung', async () => {
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 0,
    });

    await expect(
      PaymentLogService.payDebt(req, { transaction_id: 1, amount_paid: 'abc' })
    ).rejects.toThrow('amount_paid harus lebih dari 0.');
  });

  it('debt gak ketemu -> throw, gak masuk withTransaction', async () => {
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue(null);

    await expect(
      PaymentLogService.payDebt(req, { transaction_id: 999, amount_paid: 10000 })
    ).rejects.toThrow('No debt found for this transaction.');
  });

  it('debt sudah lunas -> throw', async () => {
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 40000, // sudah lunas
    });

    await expect(
      PaymentLogService.payDebt(req, { transaction_id: 1, amount_paid: 5000 })
    ).rejects.toThrow('Debt is already fully paid.');
  });

  it('bayar pas sisa hutang: remainingDebt jadi 0, gak ada extraBalance', async () => {
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 10000, // sisa 30000
    });

    const result = await PaymentLogService.payDebt(req, {
      transaction_id: 1,
      amount_paid: 30000,
    });

    expect(result.remainingDebt).toBe(0);
    expect(result.extraBalance).toBeUndefined();
    expect(CustomerBalanceService.updateCustomerBalance).not.toHaveBeenCalled();
  });

  it('bayar kurang dari sisa hutang: remainingDebt masih > 0', async () => {
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 0,
    });

    const result = await PaymentLogService.payDebt(req, {
      transaction_id: 1,
      amount_paid: 15000,
    });

    expect(result.remainingDebt).toBe(25000);
  });

  it('REGRESSION: bayar lebih dari sisa hutang -> updateCustomerBalance dipanggil dgn key `balance` (bukan `extraBalance`)', async () => {
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 0, // sisa 40000
    });

    const result = await PaymentLogService.payDebt(req, {
      transaction_id: 1,
      amount_paid: 45000, // lebih 5000
    });

    expect(result.remainingDebt).toBe(0);
    expect(result.extraBalance).toEqual({ customerId: 1, balance: 5000 });
    // Bug lama: dipanggil dgn { customer_id, extraBalance } -> `balance` selalu undefined
    // di dalam updateCustomerBalance, query gagal "Bind parameters must not contain undefined".
    expect(CustomerBalanceService.updateCustomerBalance).toHaveBeenCalledWith(
      req,
      { customer_id: 1, balance: 5000 },
      { fakeConn: true }
    );
  });

  it('saldo pelanggan belum ada row-nya -> addCustomerBalance dipanggil dgn balance 0 dulu', async () => {
    CustomerBalanceService.getCustomerBalanceById.mockResolvedValue(null);
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 0,
    });

    await PaymentLogService.payDebt(req, { transaction_id: 1, amount_paid: 10000 });

    expect(CustomerBalanceService.addCustomerBalance).toHaveBeenCalledWith(
      req,
      { customer_id: 1, balance: 0 },
      { fakeConn: true }
    );
  });

  it('created_by_role diambil dari req.user.role (Driver) dan diteruskan ke insertPaymentLogs', async () => {
    const driverReq = { user: { id: 9, role: 'Driver' } };
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 0,
    });

    await PaymentLogService.payDebt(driverReq, { transaction_id: 1, amount_paid: 10000 });

    expect(PaymentLogsModel.insertPaymentLogs).toHaveBeenCalledWith(
      1,
      1,
      '2026-01-01',
      expect.any(String),
      10000,
      { fakeConn: true },
      'Driver',
      9
    );
  });

  it('saldo pelanggan yang ada otomatis kepake sbg bagian pembayaran', async () => {
    CustomerBalanceService.getCustomerBalanceById.mockResolvedValue({ balance: 12000 });
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 0,
    });

    const result = await PaymentLogService.payDebt(req, {
      transaction_id: 1,
      amount_paid: 8000,
    });

    // totalPayment = 8000 + 12000 = 20000, semuanya kepake bayar (masih < remainingDebt 40000)
    expect(result.remainingDebt).toBe(20000);
    expect(result.customerBalance.usedBalance).toBe(12000);
    expect(CustomerBalanceService.reduceCustomerBalance).toHaveBeenCalledWith(
      req,
      { customer_id: 1, balanceUsed: 12000 },
      { fakeConn: true }
    );
  });

  it('BUG KRITIS: saldo LEBIH dari sisa hutang + admin JUGA input tunai -> saldo akhir gak boleh dobel dihitung', async () => {
    // Skenario nyata: saldo pelanggan 100.000, sisa hutang cuma 40.000 (saldo aja
    // udah lebih dari cukup), tapi admin JUGA masukin bayar tunai 5.000 (mis. gak
    // sadar saldonya udah cukup). Uang yang beneran ada di sistem: 100.000 (saldo
    // lama) + 5.000 (tunai baru) = 105.000. Abis bayar hutang 40.000, SISA yang
    // harusnya balik jadi saldo = 105.000 - 40.000 = 65.000 - BUKAN 125.000.
    CustomerBalanceService.getCustomerBalanceById.mockResolvedValue({ balance: 100000 });
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 0,
    });

    const result = await PaymentLogService.payDebt(req, {
      transaction_id: 1,
      amount_paid: 5000,
    });

    expect(result.remainingDebt).toBe(0);
    // reduceCustomerBalance ngurangin PERSIS sebanyak yang kepake buat nutupin hutang
    expect(CustomerBalanceService.reduceCustomerBalance).toHaveBeenCalledWith(
      req,
      { customer_id: 1, balanceUsed: 40000 },
      { fakeConn: true }
    );
    // updateCustomerBalance nambahin CUMA porsi tunai yang gak kepake (5000) -
    // BUKAN 65000 (yang bakal nge-dobel sisa saldo lama yang udah "ketinggal"
    // otomatis abis di-reduce di atas: 100000-40000=60000, kalau ditambah lagi
    // 65000 jadi 125000 - uang nongol dari udara).
    expect(CustomerBalanceService.updateCustomerBalance).toHaveBeenCalledWith(
      req,
      { customer_id: 1, balance: 5000 },
      { fakeConn: true }
    );
  });

  it('saldo PAS sama sisa hutang (gak lebih gak kurang) + tunai jadi murni kelebihan', async () => {
    CustomerBalanceService.getCustomerBalanceById.mockResolvedValue({ balance: 40000 });
    PaymentLogsModel.getDebtTransactionById.mockResolvedValue({
      transaction_id: 1,
      customer_id: 1,
      transaction_date: '2026-01-01',
      total_price: 40000,
      total_paid: 0,
    });

    await PaymentLogService.payDebt(req, { transaction_id: 1, amount_paid: 3000 });

    expect(CustomerBalanceService.reduceCustomerBalance).toHaveBeenCalledWith(
      req,
      { customer_id: 1, balanceUsed: 40000 },
      { fakeConn: true }
    );
    expect(CustomerBalanceService.updateCustomerBalance).toHaveBeenCalledWith(
      req,
      { customer_id: 1, balance: 3000 },
      { fakeConn: true }
    );
  });
});
