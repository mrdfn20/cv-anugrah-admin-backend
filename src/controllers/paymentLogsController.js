import PaymentLogsService from '../services/paymentLogService.js';
import moment from 'moment-timezone';

/**
 * Membayar hutang pelanggan berdasarkan transaksi ID.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const payDebt = async (req, res) => {
  try {
    const { transaction_id, payment_date, amount_paid } = req.body;

    if (!transaction_id || !amount_paid || amount_paid <= 0) {
      return res.status(400).json({ error: 'Invalid payment data' });
    }

    const results = await PaymentLogsService.payDebt(req, {
      transaction_id,
      payment_date,
      amount_paid,
    });

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No payment logs found' });
    }
    if (results.message === 'Debt is already fully paid.') {
      return res
        .status(400)
        .json({ message: results.message, transactionId: transaction_id });
    }

    if (results.message === 'No debt found for this transaction.') {
      return res
        .status(404)
        .json({ message: results.message, transactionId: transaction_id });
    }

    return res.status(201).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Mengambil daftar hutang pelanggan berdasarkan filter.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getDebtsByfilter = async (req, res) => {
  try {
    let {
      transaction_id,
      customer_id,
      startDate,
      endDate,
      status,
      sortBy,
      sortOrder,
    } = req.query;

    if (transaction_id) {
      transaction_id = parseInt(transaction_id);
      if (isNaN(transaction_id))
        return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    if (customer_id) {
      customer_id = parseInt(customer_id);
      if (isNaN(customer_id))
        return res.status(400).json({ error: 'Invalid customer ID' });
    }

    if (
      (startDate && !moment(startDate, 'YYYY-MM-DD', true).isValid()) ||
      (endDate && !moment(endDate, 'YYYY-MM-DD', true).isValid())
    ) {
      return res
        .status(400)
        .json({ error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD' });
    }

    if (status && status !== 'Lunas' && status !== 'Belum Lunas') {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const allowedSortColumns = ['transaction_date', 'remaining_debt'];
    if (sortBy && !allowedSortColumns.includes(sortBy)) {
      return res.status(400).json({ error: 'Invalid sortBy parameter' });
    }

    const allowedSortOrder = ['ASC', 'DESC'];
    if (sortOrder && !allowedSortOrder.includes(sortOrder.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid sortOrder parameter' });
    }

    const results = await PaymentLogsService.getDebtsByfilter(
      transaction_id,
      customer_id,
      startDate,
      endDate,
      status,
      sortBy,
      sortOrder
    );
    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No debts found' });
    }
    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Menambahkan log pembayaran baru ke database.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const addPaymentLogs = async (req, res) => {
  try {
    const {
      transaction_id,
      customer_id,
      owe_date,
      payment_date,
      amount_paid,
      payment_type,
    } = req.body;

    const results = await PaymentLogsService.addPaymentLogs(
      {
        transaction_id,
        customer_id,
        owe_date,
        payment_date,
        amount_paid,
        payment_type,
      },
      req
    );

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No payment logs found' });
    }
    return res.status(201).json({
      message: 'Payment Log added successfully!',
      paymentLogId: results.insertId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Mengambil semua log pembayaran.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getAllPaymentLogs = async (req, res) => {
  try {
    const results = await PaymentLogsService.getAllPaymentLogs();
    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No payment logs found' });
    }
    return res.status(200).json(results);
  } catch (err) {}
};

/**
 * Mengambil log pembayaran berdasarkan ID.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getPaymentLogById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ error: 'Invalid payment log ID' });

    const results = await PaymentLogsService.getPaymentLogById(id);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No payment logs found' });
    }

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Mengambil payment log berdasarkan ID transaksi.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getPaymentLogByTransactionId = async (req, res) => {
  try {
    const transaction_id = req.params.id;

    if (!transaction_id || isNaN(transaction_id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const results = await PaymentLogsService.getPaymentLogByTransactionId(
      transaction_id
    );

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No payment logs found' });
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mengambil payment log yang sudah dihapus (soft delete) berdasarkan ID transaksi.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getDeletedPaymentLogByTransactionId = async (req, res) => {
  try {
    const transaction_id = req.params.id;

    if (!transaction_id || isNaN(transaction_id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }

    const results =
      await PaymentLogsService.getDeletedPaymentLogByTransactionId(
        transaction_id
      );

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No deleted payment logs found' });
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
