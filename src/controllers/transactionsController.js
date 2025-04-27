import TransactionsService from '../services/transactionsService.js';

import moment from 'moment-timezone';

/**
 * Menambahkan transaksi baru ke service.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const addTransaction = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const results = await TransactionsService.addTransaction(req);

    return res.status(201).json({
      message: 'Transaction added successfully!',
      transactionId: results.transactionId,
      ...(req.body.transaction_type === 'Hutang' && {
        paymentLogId: results.paymentLogId,
      }),
    });
  } catch (error) {
    console.error('[AddTransaction Error]', error.message);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Menghapus transaksi berdasarkan ID.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  try {
    // ✅ Ambil transaksi berdasarkan ID
    const transaction = await TransactionsService.getTransactionById(id);
    if (!transaction || transaction.deleted_at) {
      return res
        .status(404)
        .json({ message: 'Transaction not found or already deleted' });
    }

    // ✅ Hitung usia transaksi (dalam menit)
    const transactionTime = moment
      .utc(transaction.created_at)
      .tz('Asia/Jakarta');
    const now = moment.tz('Asia/Jakarta');
    const transactionAge = now.diff(transactionTime, 'minutes');

    if (role === 'Editor' && transactionAge > 60) {
      return res.status(403).json({
        message: 'Editors can only delete transactions within 60 minutes',
      });
    }

    // ✅ Panggil service untuk proses delete (log sudah ada di dalam service)
    const result = await TransactionsService.deleteTransaction(id, req);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[DELETE TRANSACTION FAILED]', error.message);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Mengembalikan transaksi yang telah dihapus (soft delete restore).
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const restoreTransaction = async (req, res) => {
  const transaction_id = req.params.id;

  try {
    const result = await TransactionsService.restoreTransaction(
      transaction_id,
      req
    );
    return res.status(200).json({ message: result.message });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Mengambil semua transaksi.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getAllTransactions = async (req, res) => {
  try {
    const results = await TransactionsService.getAllTransactions();
    res.status(200).json(results);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

/**
 * Mengambil transaksi berdasarkan ID transaksi.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getTransactionById = async (req, res) => {
  const transaction_id = req.params.id;

  try {
    const result = await TransactionsService.getTransactionById(transaction_id);

    if (!result) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting transaction:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mengambil transaksi berdasarkan ID pelanggan.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getTransactionByCustomerId = async (req, res) => {
  const customer_id = req.params.id;

  try {
    const results = await TransactionsService.getTransactionByCustomerId(
      customer_id
    );
    res.json(results);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

/**
 * Mengambil transaksi berdasarkan filter (nama pelanggan, rentang tanggal).
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getTransactionsByFilter = async (req, res) => {
  let {
    customer_id,
    customer_name,
    transactionId,
    sub_region_id,
    sub_region_name,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = req.query;

  // Validasi angka
  if (customer_id && isNaN(parseInt(customer_id))) {
    return res.status(400).json({ error: 'Invalid customer_id' });
  }
  if (transactionId && isNaN(parseInt(transactionId))) {
    return res.status(400).json({ error: 'Invalid transactionId' });
  }
  if (sub_region_id && isNaN(parseInt(sub_region_id))) {
    return res.status(400).json({ error: 'Invalid sub_region_id' });
  }

  // Normalisasi nama pelanggan
  customer_name = customer_name ? decodeURI(customer_name.toUpperCase()) : null;

  // Validasi tanggal
  if (
    (startDate && !moment(startDate, 'YYYY-MM-DD', true).isValid()) ||
    (endDate && !moment(endDate, 'YYYY-MM-DD', true).isValid())
  ) {
    return res
      .status(400)
      .json({ error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD' });
  }

  // Validasi sorting
  const allowedSortColumns = ['transaction_date', 'customer_name'];
  if (sortBy && !allowedSortColumns.includes(sortBy)) {
    return res.status(400).json({ error: 'Invalid sortBy parameter' });
  }

  const allowedSortOrder = ['ASC', 'DESC'];
  if (sortOrder && !allowedSortOrder.includes(sortOrder.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid sortOrder parameter' });
  }

  try {
    const results = await TransactionsService.getTransactionsByFilter(
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

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    res.json({ message: 'Transactions found', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
