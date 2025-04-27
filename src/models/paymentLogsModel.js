import dbConnection from '../config/db.js';
import moment from 'moment-timezone';

const PaymentLogs = {
  /**
   * Mendapatkan hutang berdasarkan transaction_id
   * @param {Number} transaction_id - ID transaksi yang akan dibayar
   * @returns {Promise<Object>} - Hasil pembayaran
   */
  getDebtTransactionById: async (transaction_id) => {
    const query = `
      SELECT t.id AS transaction_id, t.customer_id, t.transaction_date, 
             t.total_price, COALESCE(SUM(pl.amount_paid), 0) AS total_paid
      FROM transactions t
      LEFT JOIN payment_logs pl ON t.id = pl.transaction_id AND pl.deleted_at IS NULL
      WHERE t.id = ? AND t.transaction_type = 'Hutang' AND t.deleted_at IS NULL
      GROUP BY t.id, t.customer_id, t.transaction_date, t.total_price
    `;
    const [results] = await dbConnection
      .promise()
      .execute(query, [transaction_id]);
    return results[0] || null;
  },

  /**
   * Mengambil daftar hutang berdasarkan filter tertentu
   * @param {Object} params - Filter yang digunakan (transaction_id, customer_id, dll.)
   * @param {Function} callback - Callback function untuk menangani hasil query
   */
  getDebtsByfilter: async (
    transaction_id,
    customer_id,
    startDate,
    endDate,
    status,
    sortBy,
    sortOrder
  ) => {
    let query = `
      SELECT 
        t.transaction_date,
        t.id AS transaction_id,
        t.customer_id,
        t.total_price,
        COALESCE(SUM(pl.amount_paid), 0) AS total_paid,
        (t.total_price - COALESCE(SUM(pl.amount_paid), 0)) AS remaining_debt,
        CASE 
          WHEN (t.total_price - COALESCE(SUM(pl.amount_paid), 0)) = 0 THEN 'Lunas' 
          ELSE 'Belum Lunas' 
        END AS status_hutang
      FROM transactions t
      LEFT JOIN payment_logs pl ON t.id = pl.transaction_id AND pl.deleted_at IS NULL
      WHERE t.transaction_type = 'Hutang' AND t.deleted_at IS NULL
    `;

    const queryParams = [];

    if (transaction_id) {
      query += ` AND t.id = ?`;
      queryParams.push(transaction_id);
    }

    if (customer_id) {
      query += ` AND t.customer_id = ?`;
      queryParams.push(customer_id);
    }

    if (startDate && endDate) {
      query += ` AND DATE(t.transaction_date) BETWEEN ? AND ?`;
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      query += ` AND DATE(t.transaction_date) >= ?`;
      queryParams.push(startDate);
    } else if (endDate) {
      query += ` AND DATE(t.transaction_date) <= ?`;
      queryParams.push(endDate);
    }

    query += ` GROUP BY t.id, t.customer_id, t.total_price`;

    if (status === 'Lunas') {
      query += ` HAVING remaining_debt = 0`;
    } else if (status === 'Belum Lunas') {
      query += ` HAVING remaining_debt > 0`;
    }

    if (sortBy === 'transaction_date') {
      query += ` ORDER BY t.transaction_date`;
    } else if (sortBy === 'remaining_debt') {
      query += ` ORDER BY remaining_debt`;
    } else {
      query += ` ORDER BY t.transaction_date`; // default
    }

    if (sortOrder === 'DESC') {
      query += ` DESC`;
    } else {
      query += ` ASC`; // default
    }

    const [results] = await dbConnection.promise().execute(query, queryParams);

    return results.map((t) => ({
      ...t,
      transaction_date: moment(t.transaction_date)
        .tz('Asia/Jakarta') 
        .format('YYYY-MM-DD'),
    }));
  },

  /**
   * Menghapus catatan pembayaran berdasarkan ID transaksi
   * @param {Number} transaction_id - ID transaksi yang akan dihapus
   */
  deletePaymentLogByTransactionId: async (transaction_id) => {
    const query = `UPDATE payment_logs SET deleted_at = NOW() WHERE transaction_id=?`;
    const [results] = await dbConnection
      .promise()
      .execute(query, [transaction_id]);
    return results;
  },

  /**
   * Mengembalikan catatan pembayaran yang dihapus berdasarkan ID transaksi
   * @param {Number} transaction_id - ID transaksi yang akan dikembalikan
   */

  restorePaymentLogByTransactionId: async (transaction_id) => {
    if (!transaction_id) {
      throw new Error('Transaction ID is required');
    }

    const query = `UPDATE payment_logs SET deleted_at = NULL WHERE transaction_id = ?`;
    const [results] = await dbConnection
      .promise()
      .execute(query, [transaction_id]);

    return results;
  },

  /**
   * Menambahkan catatan pembayaran hutang
   * @param {Object} params - Data pembayaran yang akan disimpan
   */
  insertPaymentLogs: async (
    transaction_id,
    customer_id,
    owe_date,
    payment_date,
    amount_paid
  ) => {
    const queryInsert = `
      INSERT INTO payment_logs (transaction_id, customer_id, owe_date, payment_date, amount_paid)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [results] = await dbConnection
      .promise()
      .execute(queryInsert, [
        transaction_id,
        customer_id,
        owe_date || new Date().toISOString().slice(0, 10),
        payment_date || null,
        amount_paid || 0,
      ]);

    return results;
  },

  /**
   * Mengambil semua catatan pembayaran hutang
   */
  getPaymentLogs: async () => {
    const query = `SELECT * FROM payment_logs WHERE deleted_at IS NULL`;
    const [rows] = await dbConnection.promise().execute(query);
    return rows;
  },

  /**
   * Mengambil catatan pembayaran berdasarkan ID
   */
  getPaymentLogById: async (paymentLogId) => {
    const query = `SELECT * FROM payment_logs WHERE id = ? AND deleted_at IS NULL`;
    const [rows] = await dbConnection.promise().execute(query, [paymentLogId]);
    return rows.length ? rows[0] : null;
  },

  /**
   * mengambil catatan pembayaran berdasarkan transaksi ID
   * @param {Number} transaction_id - ID transaksi yang akan diambil
   */

  getPaymentLogByTransactionId: async (transaction_id) => {
    const query = `SELECT * FROM payment_logs WHERE transaction_id = ? AND deleted_at IS NULL`;
    const [rows] = await dbConnection
      .promise()
      .execute(query, [transaction_id]);
    return rows;
  },

  /**
   * Mengambil catatan pembayaran yang dihapus berdasarkan transaksi ID
   */
  getDeletedPaymentLogByTransactionId: async (transaction_id) => {
    const query = `SELECT * FROM payment_logs WHERE transaction_id = ? AND deleted_at IS NOT NULL`;
    const [rows] = await dbConnection
      .promise()
      .execute(query, [transaction_id]);
    return rows;
  },
};

export default PaymentLogs;
