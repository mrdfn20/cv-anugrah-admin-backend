import CustomerBalanceModel from '../models/customerBalanceModel.js';
import CustomersService from '../services/customersService.js';

import logHelper from '../helpers/logHelper.js';

const CostumerBalanceService = {
  addCustomerBalance: async (req, { customer_id, balance }) => {
    const result = await CustomerBalanceModel.insertCustomerBalance(
      customer_id,
      balance
    );

    await logHelper(req, {
      action: 'CREATE',
      endpoint: '/customerbalance',
      requestData: { customer_id, balance },
      previousData: null,
    });

    return result;
  },

  updateCustomerBalance: async (req, { customer_id, balance: newBalance }) => {
    const customerData = await CustomersService.getCustomerById(customer_id);

    if (!customerData || customerData.length === 0) {
      throw new Error('No customer found');
    }

    const result = await CustomerBalanceModel.updateCustomerBalance(
      customer_id,
      newBalance
    );

    await logHelper(req, {
      action: 'UPDATE',
      endpoint: '/customerbalance/:id',
      requestData: { customer_id, balance: newBalance },
    });
    return result;
  },

  reduceCustomerBalance: async (req, { customer_id, balanceUsed }) => {
    // 1️⃣ Ambil balance pelanggan
    const balanceData = await CustomerBalanceModel.getCustomerBalanceById(
      customer_id
    );

    if (!balanceData) {
      throw new Error('Customer balance not found.');
    }

    const currentBalance = balanceData.balance;

    // 2️⃣ Validasi: pastikan cukup
    if (balanceUsed > currentBalance) {
      throw new Error(`Insufficient balance. Available: ${currentBalance}`);
    }

    // 3️⃣ Kurangi balance di DB
    const updateResult = await CustomerBalanceModel.reduceCustomerBalance(
      customer_id,
      balanceUsed
    );

    // 4️⃣ Logging jika sukses
    await logHelper(req, {
      action: 'UPDATE',
      endpoint: '/customerbalance/reduce', // sesuaikan endpoint sebenarnya jika berbeda
      requestData: { customer_id, balanceUsed },
      previousData: { balance: currentBalance },
    });

    return {
      message: 'Balance updated successfully.',
      updatedBalance: currentBalance - balanceUsed,
      result: updateResult,
    };
  },

  getCustomersBalance: async () => {
    const results = await CustomerBalanceModel.getCustomersBalance();
    return results;
  },

  getCustomerBalanceById: async (customer_id) => {
    const balance = await CustomerBalanceModel.getCustomerBalanceById(
      customer_id
    );
    return balance;
  },
};

export default CostumerBalanceService;
