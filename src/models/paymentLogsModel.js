import dbConnection from '../config/db.js';
import moment from 'moment-timezone';

const PaymentLogs = {
  /**
   * Mendapatkan hutang berdasarkan transaction_id
   * @param {Number} transaction_id - ID transaksi yang akan dibayar
   * @param {import('mysql2/promise').PoolConnection} [conn] - Koneksi transaction opsional.
   * @returns {Promise<Object>} - Hasil pembayaran
   */
  getDebtTransactionById: async (transaction_id, conn) => {
    const query = `
      SELECT t.id AS transaction_id, t.customer_id, t.transaction_date,
             t.total_price, COALESCE(SUM(pl.amount_paid), 0) AS total_paid
      FROM transactions t
      LEFT JOIN payment_logs pl ON t.id = pl.transaction_id AND pl.deleted_at IS NULL
      WHERE t.id = ? AND t.transaction_type = 'Hutang' AND t.deleted_at IS NULL
      GROUP BY t.id, t.customer_id, t.transaction_date, t.total_price
    `;
    const executor = conn || dbConnection.promise();
    const [results] = await executor.execute(query, [transaction_id]);
    return results[0] || null;
  },

  /**
   * Mengambil daftar hutang berdasarkan filter tertentu
   * `page`/`limit` OPSIONAL - kalau gak dikirim, balikin SEMUA hutang yang cocok filter
   * (perilaku lama) sbg array biasa. Kalau dikirim, return `{ data, total }`.
   * @param {Object} params - Filter yang digunakan (transaction_id, customer_id, dll.)
   */
  getDebtsByfilter: async (
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
  ) => {
    const whereClauses = [`t.transaction_type = 'Hutang'`, 't.deleted_at IS NULL'];
    const queryParams = [];

    if (transaction_id) {
      whereClauses.push('t.id = ?');
      queryParams.push(transaction_id);
    }

    if (customer_id) {
      whereClauses.push('t.customer_id = ?');
      queryParams.push(customer_id);
    }

    if (customer_name) {
      whereClauses.push('c.customer_name LIKE ?');
      queryParams.push(`%${customer_name}%`);
    }

    if (startDate && endDate) {
      whereClauses.push('DATE(t.transaction_date) BETWEEN ? AND ?');
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      whereClauses.push('DATE(t.transaction_date) >= ?');
      queryParams.push(startDate);
    } else if (endDate) {
      whereClauses.push('DATE(t.transaction_date) <= ?');
      queryParams.push(endDate);
    }

    const havingClause =
      status === 'Lunas'
        ? ' HAVING remaining_debt = 0'
        : status === 'Belum Lunas'
          ? ' HAVING remaining_debt > 0'
          : '';

    // Inti query (SELECT kolom + GROUP BY + HAVING) dipakai bareng buat query utama & COUNT
    // (COUNT wajib bungkus subquery krn ada GROUP BY/HAVING - gak bisa COUNT(*) biasa).
    const coreSelect = `
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
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN payment_logs pl ON t.id = pl.transaction_id AND pl.deleted_at IS NULL
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY t.id, t.customer_id, t.total_price${havingClause}
    `;

    let orderByClause = ' ORDER BY t.transaction_date';
    if (sortBy === 'remaining_debt') {
      orderByClause = ' ORDER BY remaining_debt';
    }
    orderByClause += sortOrder === 'DESC' ? ' DESC' : ' ASC';

    let query = coreSelect + orderByClause;
    const selectParams = [...queryParams];

    let total = null;
    if (limit) {
      const countQuery = `SELECT COUNT(*) AS total FROM (${coreSelect}) AS sub`;
      const [countResult] = await dbConnection
        .promise()
        .execute(countQuery, queryParams);
      total = countResult[0].total;

      const safePage = Math.max(parseInt(page) || 1, 1);
      const safeLimit = Math.max(parseInt(limit) || 15, 1);
      const offset = (safePage - 1) * safeLimit;
      // LIMIT/OFFSET diselipkan langsung, bukan lewat placeholder `?` - lihat catatan di
      // transactionsModel.js (mysql2 .execute() gak konsisten binding integer LIMIT/OFFSET
      // antar versi MySQL). Aman krn safeLimit/offset sudah integer positif tervalidasi.
      query += ` LIMIT ${safeLimit} OFFSET ${offset}`;
    }

    const [results] = await dbConnection.promise().execute(query, selectParams);

    const mapped = results.map((t) => ({
      ...t,
      transaction_date: moment(t.transaction_date)
        .tz('Asia/Jakarta')
        .format('YYYY-MM-DD'),
    }));

    return limit ? { data: mapped, total } : mapped;
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
   * @param {import('mysql2/promise').PoolConnection} [conn] - Koneksi transaction opsional.
   */
  insertPaymentLogs: async (
    transaction_id,
    customer_id,
    owe_date,
    payment_date,
    amount_paid,
    conn
  ) => {
    const queryInsert = `
      INSERT INTO payment_logs (transaction_id, customer_id, owe_date, payment_date, amount_paid)
      VALUES (?, ?, ?, ?, ?)
    `;

    const executor = conn || dbConnection.promise();
    const [results] = await executor.execute(queryInsert, [
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
