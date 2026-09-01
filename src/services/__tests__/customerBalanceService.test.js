import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/customerBalanceModel.js', () => ({
  default: {
    insertCustomerBalance: vi.fn(),
    updateCustomerBalance: vi.fn(),
    reduceCustomerBalance: vi.fn(),
    getCustomerBalanceById: vi.fn(),
  },
}));
vi.mock('../customersService.js', () => ({
  default: { getCustomerById: vi.fn() },
}));
vi.mock('../../helpers/logHelper.js', () => ({ default: vi.fn() }));

import CustomerBalanceService from '../customerBalanceService.js';
import CustomerBalanceModel from '../../models/customerBalanceModel.js';
import CustomersService from '../customersService.js';

const req = { user: { id: 1, role: 'Admin' } };

describe('customerBalanceService.reduceCustomerBalance', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saldo cukup -> berhasil kurangi & return updatedBalance yang benar', async () => {
    CustomerBalanceModel.getCustomerBalanceById.mockResolvedValue({ balance: 10000 });
    CustomerBalanceModel.reduceCustomerBalance.mockResolvedValue({ affectedRows: 1 });

    const result = await CustomerBalanceService.reduceCustomerBalance(req, {
      customer_id: 1,
      balanceUsed: 4000,
    });

    expect(result.updatedBalance).toBe(6000);
    expect(CustomerBalanceModel.reduceCustomerBalance).toHaveBeenCalledWith(
      1,
      4000,
      undefined
    );
  });

  it('saldo gak cukup -> throw Insufficient balance, gak jadi update DB', async () => {
    CustomerBalanceModel.getCustomerBalanceById.mockResolvedValue({ balance: 3000 });

    await expect(
      CustomerBalanceService.reduceCustomerBalance(req, {
        customer_id: 1,
        balanceUsed: 5000,
      })
    ).rejects.toThrow('Insufficient balance. Available: 3000');

    expect(CustomerBalanceModel.reduceCustomerBalance).not.toHaveBeenCalled();
  });

  it('saldo pelanggan gak ketemu -> throw', async () => {
    CustomerBalanceModel.getCustomerBalanceById.mockResolvedValue(null);

    await expect(
      CustomerBalanceService.reduceCustomerBalance(req, {
        customer_id: 999,
        balanceUsed: 1000,
      })
    ).rejects.toThrow('Customer balance not found.');
  });
});

describe('customerBalanceService.updateCustomerBalance', () => {
  beforeEach(() => vi.clearAllMocks());

  it('customer ketemu -> berhasil update', async () => {
    CustomersService.getCustomerById.mockResolvedValue([{ id: 1 }]);
    CustomerBalanceModel.updateCustomerBalance.mockResolvedValue({ affectedRows: 1 });

    const result = await CustomerBalanceService.updateCustomerBalance(req, {
      customer_id: 1,
      balance: 5000,
    });

    expect(result).toEqual({ affectedRows: 1 });
  });

  it('customer gak ketemu -> throw, gak jadi update DB', async () => {
    CustomersService.getCustomerById.mockResolvedValue([]);

    await expect(
      CustomerBalanceService.updateCustomerBalance(req, {
        customer_id: 999,
        balance: 5000,
      })
    ).rejects.toThrow('No customer found');

    expect(CustomerBalanceModel.updateCustomerBalance).not.toHaveBeenCalled();
  });
});
