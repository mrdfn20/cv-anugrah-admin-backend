// src/controllers/transactionsController.js
import TransactionsService from '../services/transactionsService.js';
import moment from 'moment-timezone';
import {
  successResponse,
  validationErrorResponse,
  notFoundErrorResponse,
  forbiddenErrorResponse,
  internalErrorResponse,
  conflictErrorResponse,
  createPaginationMeta,
} from '../helpers/responseHelper.js';

/**
 * Menambahkan transaksi baru ke service.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const addTransaction = async (req, res) => {
  try {
    // Basic validation
    if (!req.body) {
      return validationErrorResponse(res, ['Request body is required']);
    }

    // Validate required fields
    const {
      customer_id,
      gallon_filled,
      gallon_empty,
      gallon_returned,
      transaction_type,
      armada_id,
      payment_amount,
    } = req.body;

    const validationErrors = [];

    // Required field validation
    if (!customer_id) validationErrors.push('customer_id is required');
    if (gallon_filled === undefined || gallon_filled === null)
      validationErrors.push('gallon_filled is required');
    if (gallon_empty === undefined || gallon_empty === null)
      validationErrors.push('gallon_empty is required');
    if (gallon_returned === undefined || gallon_returned === null)
      validationErrors.push('gallon_returned is required');
    if (!transaction_type)
      validationErrors.push('transaction_type is required');
    if (!armada_id) validationErrors.push('armada_id is required');
    if (payment_amount === undefined || payment_amount === null)
      validationErrors.push('payment_amount is required');

    // Type validation
    if (
      customer_id &&
      (isNaN(parseInt(customer_id)) || parseInt(customer_id) < 1)
    ) {
      validationErrors.push('customer_id must be a positive number');
    }
    if (
      gallon_filled !== undefined &&
      (isNaN(parseInt(gallon_filled)) || parseInt(gallon_filled) < 0)
    ) {
      validationErrors.push('gallon_filled must be a non-negative number');
    }
    if (
      gallon_empty !== undefined &&
      (isNaN(parseInt(gallon_empty)) || parseInt(gallon_empty) < 0)
    ) {
      validationErrors.push('gallon_empty must be a non-negative number');
    }
    if (
      gallon_returned !== undefined &&
      (isNaN(parseInt(gallon_returned)) || parseInt(gallon_returned) < 0)
    ) {
      validationErrors.push('gallon_returned must be a non-negative number');
    }
    if (
      payment_amount !== undefined &&
      (isNaN(parseFloat(payment_amount)) || parseFloat(payment_amount) < 0)
    ) {
      validationErrors.push('payment_amount must be a non-negative number');
    }

    // Business logic validation
    if (transaction_type && !['Tunai', 'Hutang'].includes(transaction_type)) {
      validationErrors.push(
        'transaction_type must be either "Tunai" or "Hutang"'
      );
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }

    // Call service to add transaction
    const results = await TransactionsService.addTransaction(req);

    // Prepare response data - pakai transaction_type & payment_amount HASIL AKHIR dari
    // service (results), bukan nilai request mentah, karena Hutang bisa otomatis
    // berubah jadi Tunai kalau saldo pelanggan mencukupi seluruh total_price.
    const responseData = {
      id: results.transactionId,
      customer_id: parseInt(customer_id),
      transaction_type: results.transaction_type || transaction_type,
      gallon_price_id: parseFloat(results.gallonPrice),
      total_price: parseFloat(results.total_price),
      payment_amount: parseFloat(
        results.amount_paid !== undefined ? results.amount_paid : payment_amount
      ),
      gallon_filled: parseInt(gallon_filled),
      gallon_empty: parseInt(gallon_empty),
      gallon_returned: parseInt(gallon_returned),
      armada_id: parseInt(armada_id),
      created_at: moment
        .utc(results.created_at)
        .tz('Asia/Jakarta')
        .format('YYYY-MM-DD HH:mm:ss'),
      ...(results.paymentLogId && {
        paymentLogId: results.paymentLogId,
      }),
    };

    return successResponse(
      res,
      'Transaction added successfully',
      responseData,
      null,
      201
    );
  } catch (error) {
    console.error('[ADD TRANSACTION ERROR]', error);

    // Handle specific error types
    if (error.message && error.message.includes('Customer not found')) {
      return notFoundErrorResponse(res, 'Customer');
    }

    if (error.message && error.message.includes('Duplicate')) {
      return conflictErrorResponse(res, 'Transaction already exists');
    }

    return internalErrorResponse(res, 'Gagal menambahkan transaksi', error);
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
    // Validate ID parameter
    const transactionId = parseInt(id);
    if (isNaN(transactionId) || transactionId < 1) {
      return validationErrorResponse(res, [
        'Transaction ID harus berupa angka positif',
      ]);
    }

    // Ambil transaksi berdasarkan ID
    const transaction = await TransactionsService.getTransactionById(id);
    if (!transaction || transaction.deleted_at) {
      return notFoundErrorResponse(res, 'Transaction');
    }

    // Hitung usia transaksi (dalam menit)
    const transactionTime = moment
      .utc(transaction.created_at)
      .tz('Asia/Jakarta');
    const now = moment.tz('Asia/Jakarta');
    const transactionAge = now.diff(transactionTime, 'minutes');

    if (role === 'Editor' && transactionAge > 60) {
      return forbiddenErrorResponse(
        res,
        'Editor hanya bisa menghapus transaksi dalam 60 menit'
      );
    }

    // Panggil service untuk proses delete
    const result = await TransactionsService.deleteTransaction(id, req);

    return successResponse(
      res,
      'Transaction deleted successfully',
      {
        id: transactionId,
        deletedAt: new Date().toISOString(),
      },
      null,
      200
    );
  } catch (error) {
    console.error('[DELETE TRANSACTION ERROR]', error);
    return internalErrorResponse(res, 'Gagal menghapus transaksi', error);
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
    // Validate ID parameter
    const transactionId = parseInt(transaction_id);
    if (isNaN(transactionId) || transactionId < 1) {
      return validationErrorResponse(res, [
        'Transaction ID harus berupa angka positif',
      ]);
    }

    const result = await TransactionsService.restoreTransaction(
      transaction_id,
      req
    );

    return successResponse(
      res,
      'Transaction restored successfully',
      {
        id: transactionId,
        restoredAt: new Date().toISOString(),
      },
      null,
      200
    );
  } catch (error) {
    console.error('[RESTORE TRANSACTION ERROR]', error);
    return internalErrorResponse(res, 'Gagal restore transaksi', error);
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

    if (!results || results.length === 0) {
      return successResponse(res, 'No transactions found', [], null, 200);
    }

    return successResponse(
      res,
      'Transactions retrieved successfully',
      results,
      null,
      200
    );
  } catch (error) {
    console.error('[GET ALL TRANSACTIONS ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data transaksi', error);
  }
};

/**
 * Mengambil transaksi yang sudah di-soft-delete (buat fitur restore).
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getDeletedTransactions = async (req, res) => {
  try {
    const results = await TransactionsService.getDeletedTransactions();

    if (!results || results.length === 0) {
      return successResponse(res, 'No deleted transactions found', [], null, 200);
    }

    return successResponse(
      res,
      'Deleted transactions retrieved successfully',
      results,
      null,
      200
    );
  } catch (error) {
    console.error('[GET DELETED TRANSACTIONS ERROR]', error);
    return internalErrorResponse(
      res,
      'Gagal mengambil data transaksi terhapus',
      error
    );
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
    // Validate ID parameter
    const transactionId = parseInt(transaction_id);
    if (isNaN(transactionId) || transactionId < 1) {
      return validationErrorResponse(res, [
        'Transaction ID harus berupa angka positif',
      ]);
    }

    const result = await TransactionsService.getTransactionById(transaction_id);

    if (!result) {
      return notFoundErrorResponse(res, 'Transaction');
    }

    return successResponse(
      res,
      'Transaction retrieved successfully',
      result,
      null,
      200
    );
  } catch (error) {
    console.error('[GET TRANSACTION BY ID ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data transaksi', error);
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
    // Validate ID parameter
    const customerId = parseInt(customer_id);
    if (isNaN(customerId) || customerId < 1) {
      return validationErrorResponse(res, [
        'Customer ID harus berupa angka positif',
      ]);
    }

    const results = await TransactionsService.getTransactionByCustomerId(
      customer_id
    );

    if (!results || results.length === 0) {
      return successResponse(
        res,
        'No transactions found for this customer',
        [],
        null,
        200
      );
    }

    return successResponse(
      res,
      'Customer transactions retrieved successfully',
      results,
      null,
      200
    );
  } catch (error) {
    console.error('[GET TRANSACTIONS BY CUSTOMER ERROR]', error);
    return internalErrorResponse(
      res,
      'Gagal mengambil data transaksi customer',
      error
    );
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
    page,
    limit,
  } = req.query;

  try {
    // Validation array to collect all errors
    const validationErrors = [];

    // Validasi angka
    if (customer_id && isNaN(parseInt(customer_id))) {
      validationErrors.push('customer_id harus berupa angka');
    }
    if (transactionId && isNaN(parseInt(transactionId))) {
      validationErrors.push('transactionId harus berupa angka');
    }
    if (sub_region_id && isNaN(parseInt(sub_region_id))) {
      validationErrors.push('sub_region_id harus berupa angka');
    }
    // page/limit OPSIONAL - kalau gak dikirim (mis. dari halaman Laporan), query jalan
    // tanpa pagination & tetap balikin SEMUA transaksi yang cocok filter (perilaku lama).
    if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
      validationErrors.push('page harus angka >= 1');
    }
    if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1)) {
      validationErrors.push('limit harus angka >= 1');
    }

    // Validasi tanggal
    if (startDate && !moment(startDate, 'YYYY-MM-DD', true).isValid()) {
      validationErrors.push('Format startDate harus YYYY-MM-DD');
    }
    if (endDate && !moment(endDate, 'YYYY-MM-DD', true).isValid()) {
      validationErrors.push('Format endDate harus YYYY-MM-DD');
    }

    // Validasi sorting
    const allowedSortColumns = ['transaction_date', 'customer_name'];
    if (sortBy && !allowedSortColumns.includes(sortBy)) {
      validationErrors.push(
        `sortBy harus salah satu dari: ${allowedSortColumns.join(', ')}`
      );
    }

    const allowedSortOrder = ['ASC', 'DESC'];
    if (sortOrder && !allowedSortOrder.includes(sortOrder.toUpperCase())) {
      validationErrors.push(`sortOrder harus ASC atau DESC`);
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }

    // Normalisasi nama pelanggan
    customer_name = customer_name
      ? decodeURI(customer_name.toUpperCase())
      : null;

    const results = await TransactionsService.getTransactionsByFilter(
      customer_id,
      customer_name,
      transactionId,
      sub_region_id,
      sub_region_name,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      page,
      limit
    );

    // `limit` dikirim -> results berbentuk { data, total } (paginated).
    // `limit` gak dikirim -> results array biasa (perilaku lama, dipakai halaman Laporan).
    const isPaginated = limit && results && !Array.isArray(results);
    const data = isPaginated ? results.data : results;
    const meta = isPaginated
      ? createPaginationMeta(results.total, parseInt(page) || 1, parseInt(limit))
      : null;

    if (!data || data.length === 0) {
      return successResponse(
        res,
        'No transactions found with applied filters',
        [],
        meta,
        200
      );
    }

    return successResponse(
      res,
      'Filtered transactions retrieved successfully',
      data,
      meta,
      200
    );
  } catch (error) {
    console.error('[GET TRANSACTIONS BY FILTER ERROR]', error);
    return internalErrorResponse(
      res,
      'Gagal mengambil data transaksi dengan filter',
      error
    );
  }
};
