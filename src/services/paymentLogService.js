import PaymentLogsModel from '../models/paymentLogsModel.js';
import CustomerBalanceService from './customerBalanceService.js';

import logHelper from '../helpers/logHelper.js';

const PaymentLogService = {
  payDebt: async (req, { transaction_id, payment_date, amount_paid }) => {
    const debt = await PaymentLogsModel.getDebtTransactionById(transaction_id);
    if (!debt) {
      throw new Error('No debt found for this transaction.');
    }

    const remainingDebt = debt.total_price - debt.total_paid;
    if (remainingDebt <= 0) {
      throw new Error('Debt is already fully paid.');
    }

    // 🔄 Ambil saldo pelanggan
    const balanceData = await CustomerBalanceService.getCustomerBalanceById(
      debt.customer_id
    );
    const customerBalance = balanceData ? parseInt(balanceData.balance) : 0;

    // ❗ Jika saldo belum ada, buatkan dengan 0
    if (!balanceData) {
      await CustomerBalanceService.addCustomerBalance(req, {
        customer_id: debt.customer_id,
        balance: 0,
      });
    }

    // 🔢 Hitung pembayarannya
    const totalPayment = amount_paid + customerBalance;
    const paymentForDebt = Math.min(totalPayment, remainingDebt);
    const balanceUsed = Math.min(customerBalance, remainingDebt);
    const extraBalance = Math.max(totalPayment - remainingDebt, 0);

    // 🔁 Kurangi saldo jika digunakan
    if (balanceUsed > 0) {
      await CustomerBalanceService.reduceCustomerBalance(req, {
        customer_id: debt.customer_id,
        balanceUsed,
      });
    }

    // 💾 Simpan log pembayaran
    const paymentResult = await PaymentLogService.addPaymentLogs(req, {
      transaction_id: debt.transaction_id,
      customer_id: debt.customer_id,
      owe_date: debt.transaction_date,
      payment_date: payment_date || new Date().toISOString().slice(0, 10),
      amount_paid: paymentForDebt,
    });

    // ✅ Logging
    await logHelper(req, {
      action: 'CREATE',
      endpoint: '/paymentlogs/paydebt',
      requestData: {
        transaction_id,
        customer_id: debt.customer_id,
        payment_date,
        amount_paid: paymentForDebt,
      },
    });

    // ➕ Tambahkan saldo jika ada kelebihan
    let response = {
      message: 'Payment recorded successfully.',
      paymentLogId: paymentResult.insertId,
      transactionId: debt.transaction_id,
      remainingDebt: remainingDebt - paymentForDebt,
    };

    if (extraBalance > 0) {
      const balanceResult = await CustomerBalanceService.updateCustomerBalance(
        req,
        {
          customer_id: debt.customer_id,
          extraBalance,
        }
      );
      response.extraBalance = {
        customerId: debt.customer_id,
        balance: extraBalance,
      };
    }

    if (balanceUsed > 0) {
      response.customerBalance = {
        customerId: debt.customer_id,
        usedBalance: balanceUsed,
        message: `Balance sebesar ${balanceUsed.toLocaleString(
          'id-ID'
        )} telah digunakan.`,
      };
    }

    return response;
  },

  getDebtsByfilter: async (
    transaction_id,
    customer_id,
    startDate,
    endDate,
    status,
    sortBy,
    sortOrder
  ) => {
    const results = await PaymentLogsModel.getDebtsByfilter(
      transaction_id,
      customer_id,
      startDate,
      endDate,
      status,
      sortBy,
      sortOrder
    );
    return results;
  },

  deletePaymentLogByTransactionId: async (transaction_id, req) => {
    const result = await PaymentLogsModel.deletePaymentLogByTransactionId(
      transaction_id
    );

    // ✅ Logging penghapusan payment log
    await logHelper(req, {
      action: 'DELETE',
      endpoint: '/paymentlogs/:transaction_id',
      requestData: { transaction_id },
    });

    return result;
  },

  restorePaymentLogByTransactionId: async (transaction_id, req) => {
    const results = await PaymentLogsModel.restorePaymentLogByTransactionId(
      transaction_id
    );

    // ✅ Logging setelah berhasil restore
    await logHelper({
      req,
      action: 'RESTORE',
      endpoint: '/paymentlogs/restore',
      requestData: { transaction_id },
      previousData: null,
    });

    return results;
  },

  addPaymentLogs: async (
    req,
    { transaction_id, customer_id, owe_date, payment_date, amount_paid }
  ) => {
    const result = await PaymentLogsModel.insertPaymentLogs(
      transaction_id,
      customer_id,
      owe_date,
      payment_date,
      amount_paid
    );

    // ✅ Logging setelah berhasil insert
    await logHelper(req, {
      action: 'CREATE',
      endpoint: '/paymentlogs',
      requestData: {
        transaction_id,
        customer_id,
        owe_date,
        payment_date,
        amount_paid,
      },
    });

    return result;
  },

  getAllPaymentLogs: async () => {
    return await PaymentLogsModel.getPaymentLogs();
  },

  getPaymentLogById: async (paymentLogId) => {
    return await PaymentLogsModel.getPaymentLogById(paymentLogId);
  },

  getPaymentLogByTransactionId: async (transaction_id) => {
    return await PaymentLogsModel.getPaymentLogByTransactionId(transaction_id);
  },

  getDeletedPaymentLogByTransactionId: async (transaction_id) => {
    return await PaymentLogsModel.getDeletedPaymentLogByTransactionId(
      transaction_id
    );
  },
};

export default PaymentLogService;
