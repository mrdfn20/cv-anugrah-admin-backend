import dbConnection from '../config/db.js';
import moment from 'moment-timezone';

const Transactions = {
  /**
   * Menyimpan transaksi baru ke database (tanpa logika bisnis).
   * @param {Object} data - Data transaksi
   * @returns {Promise<number>} ID transaksi baru
   */
  insertTransaction: async (data) => {
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

    const [results] = await dbConnection
      .promise()
      .execute(query, [
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
    const [results] = await dbConnection.execute(query, [transaction_id]);
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
    sortOrder
  ) => {
    let query = `
      SELECT t.* 
      FROM transactions t 
      JOIN customers c ON t.customer_id = c.id 
      LEFT JOIN sub_regions sr ON c.sub_region_id = sr.id
      WHERE 1=1 AND t.deleted_at IS NULL
    `;

    const queryParams = [];

    if (customer_id) {
      query += ` AND c.id = ?`;
      queryParams.push(customer_id);
    }

    if (customer_name) {
      query += ` AND c.customer_name LIKE ?`;
      queryParams.push(`%${customer_name}%`);
    }

    if (transactionId) {
      query += ` AND t.id = ?`;
      queryParams.push(transactionId);
    }

    if (sub_region_id) {
      query += ` AND c.sub_region_id = ?`;
      queryParams.push(sub_region_id);
    }

    if (sub_region_name) {
      query += ` AND sr.sub_region_name LIKE ?`;
      queryParams.push(`%${sub_region_name}%`);
    }

    if (startDate && endDate) {
      query += ` AND DATE(t.transaction_date) BETWEEN ? AND ?`;
      queryParams.push(startDate, endDate);
    } else {
      if (startDate) {
        query += ` AND DATE(t.transaction_date) >= ?`;
        queryParams.push(startDate);
      }
      if (endDate) {
        query += ` AND DATE(t.transaction_date) <= ?`;
        queryParams.push(endDate);
      }
    }

    // Sorting
    if (!sortBy) {
      query += ` ORDER BY t.transaction_date`;
    } else if (sortBy === 'transaction_date') {
      query += ` ORDER BY t.transaction_date`;
    } else if (sortBy === 'customer_name') {
      query += ` ORDER BY c.customer_name`;
    }

    if (sortOrder === 'ASC' || sortOrder === 'DESC') {
      query += ` ${sortOrder}`;
    }

    console.log('Query:', query);
    console.log('Params:', queryParams);

    const [results] = await dbConnection.promise().execute(query, queryParams);
    return results.map((t) => ({
      ...t,
      transaction_date: moment(t.transaction_date)
        .tz('Asia/Jakarta')
        .format('YYYY-MM-DD'),
    }));
  },
};

export default Transactions;
