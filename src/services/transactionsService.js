import TransactionsModel from '../models/transactionsModel.js';

import PaymentLogService from '../services/paymentLogService.js';
import CustomerBalanceService from '../services/customerBalanceService.js';
import GallonService from '../services/gallonService.js';

import logHelper from '../helpers/logHelper.js';

const TransactionService = {
  addTransaction: async (transactionData) => {
    const {
      customer_id,
      gallon_filled,
      gallon_empty,
      gallon_returned,
      transaction_type,
      armada_id,
      payment_amount,
    } = transactionData.body;

    // 1️⃣ Ambil harga galon otomatis dari pelanggan
    const gallonPriceData = await GallonService.getGallonPriceByCustomerId(
      customer_id
    );

    if (!gallonPriceData || !gallonPriceData.price) {
      throw new Error('Customer or gallon price not found');
    }

    const { id: gallon_price_id, price: gallonPrice } = gallonPriceData;
    const total_price = gallonPrice * (gallon_filled || 0);

    if (isNaN(total_price) || total_price < 0) {
      throw new Error('Total price calculation error');
    }

    // 2️⃣ Cek apakah pelanggan memiliki saldo
    const customerBalanceData =
      await CustomerBalanceService.getCustomerBalanceById(customer_id);
    const customerBalance = customerBalanceData
      ? customerBalanceData.balance
      : 0;

    let amount_paid = 0;
    let balanceUsed = 0;

    // 3️⃣ Logika pembayaran jika hutang
    if (transaction_type === 'Hutang') {
      if (customerBalance > 0) {
        balanceUsed = Math.min(customerBalance, total_price);
        amount_paid = balanceUsed;
      }
      amount_paid += payment_amount;
    } else {
      amount_paid = total_price;
    }

    let finalTransactionType = transaction_type;
    if (transaction_type === 'Hutang' && amount_paid === total_price) {
      finalTransactionType = 'Tunai';
    }

    // 4️⃣ Jika menggunakan saldo, kurangi saldo
    if (balanceUsed > 0) {
      await CustomerBalanceService.reduceCustomerBalance(
        customer_id,
        balanceUsed,
        transactionData
      );
    }

    // 5️⃣ Simpan transaksi ke DB
    const transactionId = await TransactionsModel.insertTransaction({
      customer_id,
      gallon_filled,
      gallon_empty,
      gallon_returned,
      transaction_type: finalTransactionType,
      armada_id,
      gallon_price_id,
      total_price,
      payment_amount: amount_paid,
    });

    // ✅ Logging transaksi
    await logHelper(transactionData, {
      action: 'CREATE',
      endpoint: '/transactions',
      requestData: {
        customer_id,
        gallon_filled,
        gallon_empty,
        gallon_returned,
        transaction_type: finalTransactionType,
        armada_id,
        gallon_price_id,
        total_price,
        payment_amount: amount_paid,
      },
    });

    let response = { transactionId };

    // 6️⃣ Catat ke payment_logs jika hutang
    if (finalTransactionType === 'Hutang' && amount_paid >= 0) {

      const paymentResult = await PaymentLogService.addPaymentLogs(
        transactionData,
        {
          transaction_id: transactionId,
          customer_id,
          owe_date: new Date().toISOString().slice(0, 10),
          payment_date: null,
          amount_paid,
        }
      ); // Kirim `transactionData` ke service tujuan

      response.paymentLogId = paymentResult.insertId;

      // 7️⃣ Jika ada kelebihan, simpan sebagai saldo
      const extraBalance = amount_paid - total_price;
      if (extraBalance > 0) {
        const balanceResult =
          await CustomerBalanceService.updateCustomerBalance(
            customer_id,
            extraBalance,
            transactionData // Kirim `transactionData` agar logging terjadi di modul balance
          );
        response.extraBalance = balanceResult;
      }
    }

    return response;
  },

  deleteTransaction: async (transaction_id, req) => {
    // 1️⃣ Soft delete transaksi
    const result = await TransactionsModel.softDeleteTransactionById(
      transaction_id
    );
    if (result.affectedRows === 0) {
      throw new Error('Transaction not found or cannot be deleted');
    }

    // ✅ Logging transaksi setelah berhasil dihapus
    await logHelper(req, {
      action: 'DELETE',
      endpoint: '/transactions/:id',
      requestData: { transaction_id },
      previousData: await TransactionsModel.getTransactionById(transaction_id), // optional
    });

    // 2️⃣ Cek apakah ada payment log yang terkait via service
    const paymentLogs = await PaymentLogService.getPaymentLogByTransactionId(
      transaction_id
    );

    if (paymentLogs && paymentLogs.length > 0) {
      // 3️⃣ Hapus payment log
      await PaymentLogService.deletePaymentLogByTransactionId(
        transaction_id,
        req
      ); // req diteruskan untuk logging
      return {
        message:
          'Transaction and related PaymentLogs successfully soft deleted.',
      };
    }

    return {
      message: 'Transaction successfully soft deleted (no payment log found).',
    };
  },

  restoreTransaction: async (transaction_id, req) => {
    // 1️⃣ Restore transaksi terlebih dahulu
    const restoreTransactionResult =
      await TransactionsModel.restoreTransactionById(transaction_id);

    if (restoreTransactionResult.affectedRows === 0) {
      throw new Error('Transaction not found or already active');
    }

    await logHelper({
      req,
      action: 'RESTORE',
      endpoint: '/transactions/restore/:id',
      requestData: { transaction_id },
      previousData: null,
    });

    // ✅ Logging transaksi setelah berhasil di-restore

    // 2️⃣ Ambil payment log yang sudah dihapus (soft delete)
    const deletedPaymentLogs =
      await PaymentLogService.getDeletedPaymentLogByTransactionId(
        transaction_id
      );

    // 3️⃣ Jika ada, panggil service untuk restore + log di dalam modulnya
    if (deletedPaymentLogs && deletedPaymentLogs.length > 0) {
      const restoreLogsResult =
        await PaymentLogService.restorePaymentLogByTransactionId(
          transaction_id,
          req
        );

      if (restoreLogsResult.affectedRows === 0) {
        throw new Error('PaymentLog not found or cannot be restored');
      }

      return {
        message: 'Transaction and PaymentLog successfully restored.',
      };
    }

    // ✅ Tidak ada payment log
    return {
      message: 'Transaction restored successfully (no payment log found).',
    };
  },

  getTransactionById: async (transaction_id) => {
    return await TransactionsModel.getTransactionById(transaction_id);
  },

  getAllTransactions: async () => {
    const results = await TransactionsModel.getTransactions();

    if (!results || results.length === 0) {
      throw new Error('No transactions found');
    }

    return results;
  },

  getTransactionByCustomerId: async (customer_id) => {
    const transactions = await TransactionsModel.getTransactionByCustomerId(
      customer_id
    );
    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions found for this customer');
    }
    return transactions;
  },

  getTransactionsByFilter: async (
    customer_id,
    customer_name,
    transactionId,
    sub_region_id,
    sub_region_name,
    startDate,
    endDate,
    sortBy,
    sortOrder
  ) => {
    return await TransactionsModel.getTransactionsByFilter(
      customer_id,
      customer_name,
      transactionId,
      sub_region_id,
      sub_region_name,
      startDate,
      endDate,
      sortBy,
      sortOrder
    );
  },
};

export default TransactionService;
