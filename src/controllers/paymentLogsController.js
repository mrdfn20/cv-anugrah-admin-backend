import PaymentLogsService from '../services/paymentLogService.js';
import moment from 'moment-timezone';
import {
  successResponse,
  validationErrorResponse,
  notFoundErrorResponse,
  internalErrorResponse,
  createPaginationMeta,
} from '../helpers/responseHelper.js';

/**
 * Membayar hutang pelanggan berdasarkan transaksi ID.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const payDebt = async (req, res) => {
  try {
    const { transaction_id, payment_date, amount_paid } = req.body;

    if (!transaction_id || !amount_paid || amount_paid <= 0) {
      return validationErrorResponse(res, ['Invalid payment data']);
    }

    const results = await PaymentLogsService.payDebt(req, {
      transaction_id,
      payment_date,
      amount_paid,
    });

    return successResponse(res, 'Payment recorded successfully', results, null, 201);
  } catch (error) {
    console.error('[PAY DEBT ERROR]', error);

    if (error.message === 'No debt found for this transaction.') {
      return notFoundErrorResponse(res, 'Debt');
    }

    if (error.message === 'Debt is already fully paid.') {
      return validationErrorResponse(res, [error.message]);
    }

    return internalErrorResponse(res, 'Gagal memproses pembayaran hutang', error);
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
      customer_name,
      startDate,
      endDate,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const validationErrors = [];

    if (transaction_id) {
      transaction_id = parseInt(transaction_id);
      if (isNaN(transaction_id)) validationErrors.push('Invalid transaction ID');
    }

    if (customer_id) {
      customer_id = parseInt(customer_id);
      if (isNaN(customer_id)) validationErrors.push('Invalid customer ID');
    }

    if (
      (startDate && !moment(startDate, 'YYYY-MM-DD', true).isValid()) ||
      (endDate && !moment(endDate, 'YYYY-MM-DD', true).isValid())
    ) {
      validationErrors.push('Format tanggal tidak valid. Gunakan YYYY-MM-DD');
    }

    if (status && status !== 'Lunas' && status !== 'Belum Lunas') {
      validationErrors.push('Invalid status');
    }

    const allowedSortColumns = ['transaction_date', 'remaining_debt'];
    if (sortBy && !allowedSortColumns.includes(sortBy)) {
      validationErrors.push('Invalid sortBy parameter');
    }

    const allowedSortOrder = ['ASC', 'DESC'];
    if (sortOrder && !allowedSortOrder.includes(sortOrder.toUpperCase())) {
      validationErrors.push('Invalid sortOrder parameter');
    }

    // page/limit OPSIONAL - kalau gak dikirim, balikin semua hutang yang cocok filter
    if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
      validationErrors.push('page harus angka >= 1');
    }
    if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1)) {
      validationErrors.push('limit harus angka >= 1');
    }

    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }

    const results = await PaymentLogsService.getDebtsByfilter(
      transaction_id,
      customer_id,
      customer_name,
      startDate,
      endDate,
      status,
      sortBy,
      sortOrder,
      page,
      limit
    );

    const isPaginated = limit && results && !Array.isArray(results);
    const debts = isPaginated ? results.data : results;
    const meta = isPaginated
      ? createPaginationMeta(results.total, parseInt(page) || 1, parseInt(limit))
      : null;

    if (!debts || debts.length === 0) {
      return successResponse(res, 'No debts found', [], meta, 200);
    }

    return successResponse(res, 'Debts retrieved successfully', debts, meta, 200);
  } catch (error) {
    console.error('[GET DEBTS BY FILTER ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data hutang', error);
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
      return notFoundErrorResponse(res, 'Payment log');
    }

    return successResponse(
      res,
      'Payment log added successfully',
      { paymentLogId: results.insertId },
      null,
      201
    );
  } catch (error) {
    console.error('[ADD PAYMENT LOG ERROR]', error);
    return internalErrorResponse(res, 'Gagal menambahkan payment log', error);
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
      return successResponse(res, 'No payment logs found', [], null, 200);
    }
    return successResponse(res, 'Payment logs retrieved successfully', results, null, 200);
  } catch (error) {
    console.error('[GET ALL PAYMENT LOGS ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data payment logs', error);
  }
};

/**
 * Mengambil log pembayaran berdasarkan ID.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getPaymentLogById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return validationErrorResponse(res, ['Invalid payment log ID']);
    }

    const results = await PaymentLogsService.getPaymentLogById(id);

    if (!results || results.length === 0) {
      return notFoundErrorResponse(res, 'Payment log');
    }

    return successResponse(res, 'Payment log retrieved successfully', results, null, 200);
  } catch (error) {
    console.error('[GET PAYMENT LOG BY ID ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data payment log', error);
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
      return validationErrorResponse(res, ['Invalid transaction ID']);
    }

    const results = await PaymentLogsService.getPaymentLogByTransactionId(
      transaction_id
    );

    // Belum ada riwayat pembayaran itu kondisi normal (transaksi hutang baru),
    // bukan error - balas array kosong, bukan 404.
    return successResponse(
      res,
      results && results.length > 0
        ? 'Payment logs retrieved successfully'
        : 'No payment logs found',
      results || [],
      null,
      200
    );
  } catch (error) {
    console.error('[GET PAYMENT LOG BY TRANSACTION ID ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil riwayat pembayaran', error);
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
      return validationErrorResponse(res, ['Invalid transaction ID']);
    }

    const results =
      await PaymentLogsService.getDeletedPaymentLogByTransactionId(
        transaction_id
      );

    if (!results || results.length === 0) {
      return successResponse(res, 'No deleted payment logs found', [], null, 200);
    }

    return successResponse(
      res,
      'Deleted payment logs retrieved successfully',
      results,
      null,
      200
    );
  } catch (error) {
    console.error('[GET DELETED PAYMENT LOG ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data payment log terhapus', error);
  }
};
