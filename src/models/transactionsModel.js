import dbConnection from '../config/db.js';
import moment from 'moment-timezone';

const Transactions = {
  /**
   * Menyimpan transaksi baru ke database (tanpa logika bisnis).
   * @param {Object} data - Data transaksi
   * @returns {Promise<number>} ID transaksi baru
   */
  /**
   * @param {Object} data - Data transaksi
   * @param {import('mysql2/promise').PoolConnection} [conn] - Koneksi transaction opsional
   *   (dipakai dari withTransaction() saat insert ini bagian dari alur multi-step).
   */
  insertTransaction: async (data, conn) => {
    const {
      customer_id,
      gallon_filled,
      gallon_empty,
      gallon_returned,
      transaction_type,
      armada_id,
      gallon_price_id,
      total_price,
      payment_amount,
    } = data;

    const query = `
      INSERT INTO transactions (
        transaction_date, customer_id, gallon_filled, gallon_empty, gallon_returned,
        transaction_type, armada_id, gallon_price_id, total_price, payment_amount
      )
      VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const executor = conn || dbConnection.promise();
    const [results] = await executor.execute(query, [
      customer_id,
      gallon_filled,
      gallon_empty,
      gallon_returned,
      transaction_type,
      armada_id,
      gallon_price_id,
      total_price,
      payment_amount,
    ]);

    return results.insertId;
  },

  /**
   * Menghapus transaksi dan atau paymentlog dengan metode soft delete (tidak benar-benar dihapus)
   * Hanya bisa dihapus jika transaksi dibuat dalam 60 menit terakhir
   */

  softDeleteTransactionById: async (transaction_id) => {
    const query = `
      UPDATE transactions
      SET deleted_at = NOW()
      WHERE id = ?
    `;

    const [results] = await dbConnection
      .promise()
      .execute(query, [transaction_id]);
    return results;
  },

  /**
   * Memulihkan transaksi yang sebelumnya dihapus (soft delete)
   */
  restoreTransactionById: async (transaction_id) => {
    const query = `
      UPDATE transactions
      SET deleted_at = NULL
      WHERE id = ?
    `;
    const [results] = await dbConnection.promise().execute(query, [transaction_id]);
    return results;
  },

  /**
   * Mengambil semua transaksi dari database
   */
  getTransactions: async () => {
    const query = `SELECT * FROM transactions WHERE deleted_at IS NULL`;
    const [results] = await dbConnection.promise().execute(query);
    return results;
  },

  /**
   * Mengambil transaksi yang sudah di-soft-delete (buat fitur restore)
   */
  getDeletedTransactions: async () => {
    const query = `
      SELECT t.*, c.customer_name
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.deleted_at IS NOT NULL
      ORDER BY t.deleted_at DESC
    `;
    const [results] = await dbConnection.promise().execute(query);
    return results;
  },

  /**
   * Mengambil transaksi berdasarkan id dari database
   * @param {Function} callback - Fungsi callback untuk menangani hasil
   */
  getTransactionById: async (transaction_id) => {
    const query = `SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL`;
    const [results] = await dbConnection
      .promise()
      .execute(query, [transaction_id]);
    return results[0] || null;
  },

  /**
   * Mengambil transaksi berdasarkan customer_id
   */
  getTransactionByCustomerId: async (customer_id) => {
    const query = `
      SELECT * FROM transactions
      WHERE customer_id = ?
      AND deleted_at IS NULL
    `;
    const [results] = await dbConnection
      .promise()
      .execute(query, [customer_id]);
    return results;
  },

  /**
   * Mengambil transaksi berdasarkan filter id pel ,nama pel, id trans, sub region id, sub region name dan rentang tanggal
   *
   * `page`/`limit` OPSIONAL: dipakai FE halaman Transaksi (server-side pagination). Kalau
   * `limit` gak dikirim (mis. dipanggil dari halaman Laporan yang butuh SEMUA transaksi dalam
   * rentang tanggal, bukan cuma 1 halaman), query jalan tanpa LIMIT/OFFSET persis kayak
   * perilaku lama - return array biasa. Kalau `limit` dikirim, return `{ data, total }`.
   */
  getTransactionsByFilter: async (
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
  ) => {
    const whereClauses = ['1=1', 't.deleted_at IS NULL'];
    const queryParams = [];

    if (customer_id) {
      whereClauses.push('c.id = ?');
      queryParams.push(customer_id);
    }

    if (customer_name) {
      whereClauses.push('c.customer_name LIKE ?');
      queryParams.push(`%${customer_name}%`);
    }

    if (transactionId) {
      whereClauses.push('t.id = ?');
      queryParams.push(transactionId);
    }

    if (sub_region_id) {
      whereClauses.push('c.sub_region_id = ?');
      queryParams.push(sub_region_id);
    }

    if (sub_region_name) {
      whereClauses.push('sr.sub_region_name LIKE ?');
      queryParams.push(`%${sub_region_name}%`);
    }

    if (startDate && endDate) {
      whereClauses.push('DATE(t.transaction_date) BETWEEN ? AND ?');
      queryParams.push(startDate, endDate);
    } else {
      if (startDate) {
        whereClauses.push('DATE(t.transaction_date) >= ?');
        queryParams.push(startDate);
      }
      if (endDate) {
        whereClauses.push('DATE(t.transaction_date) <= ?');
        queryParams.push(endDate);
      }
    }

    const fromAndWhere = `
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN sub_regions sr ON c.sub_region_id = sr.id
      WHERE ${whereClauses.join(' AND ')}
    `;

    let orderByClause = '';
    if (!sortBy || sortBy === 'transaction_date') {
      orderByClause = ' ORDER BY t.transaction_date';
    } else if (sortBy === 'customer_name') {
      orderByClause = ' ORDER BY c.customer_name';
    }
    if (sortOrder === 'ASC' || sortOrder === 'DESC') {
      orderByClause += ` ${sortOrder}`;
    }

    let query = `SELECT t.* ${fromAndWhere}${orderByClause}`;
    const selectParams = [...queryParams];

    let total = null;
    if (limit) {
      const countQuery = `SELECT COUNT(*) AS total ${fromAndWhere}`;
      const [countResult] = await dbConnection
        .promise()
        .execute(countQuery, queryParams);
      total = countResult[0].total;

      const safePage = Math.max(parseInt(page) || 1, 1);
      const safeLimit = Math.max(parseInt(limit) || 10, 1);
      const offset = (safePage - 1) * safeLimit;
      // LIMIT/OFFSET diselipkan langsung (bukan lewat placeholder `?`) - mysql2 prepared
      // statement (.execute()) punya masalah kompatibilitas binding integer LIMIT/OFFSET
      // di beberapa versi MySQL (jalan di MariaDB lokal, gagal "Incorrect arguments to
      // mysqld_stmt_execute" di MySQL 8.4). Aman krn safeLimit/offset sudah dipaksa jadi
      // integer positif lewat parseInt+Math.max di atas, gak ada input mentah user masuk sini.
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
};

export default Transactions;
