import dbConnection from '../config/db.js';

// Default: pool connection biasa (perilaku lama). Kalau dipanggil dari dalam
// withTransaction() (lihat helpers/dbTransactionHelper.js), caller kirim koneksi
// khusus transaction di sini supaya query ikut ke transaction yang sama.
const defaultConn = dbConnection.promise();

const CustomerBalance = {
  /**
   * Menambahkan saldo pelanggan baru ke dalam database.
   * Jika customer_id sudah ada, saldo awalnya diatur dari awal.
   * @param {number} customer_id - ID pelanggan.
   * @param {number} balance - Jumlah saldo awal pelanggan.
   * @param {import('mysql2/promise').PoolConnection} [conn] - Koneksi transaction opsional.
   */
  insertCustomerBalance: async (customer_id, balance, conn = defaultConn) => {
    const query = `
      INSERT INTO customer_balances (customer_id, balance)
      VALUES (?, ?)
    `;
    const [results] = await conn.execute(query, [customer_id, balance]);
    return results;
  },

  /**
   * Memperbarui saldo pelanggan jika customer_id sudah ada.
   * Jika pelanggan belum memiliki saldo, akan dibuat saldo awal.
   * Jika sudah ada, saldo ditambahkan dengan nilai baru.
   * @param {number} customer_id - ID pelanggan.
   * @param {number} newBalance - Saldo yang ditambahkan.
   * @param {import('mysql2/promise').PoolConnection} [conn] - Koneksi transaction opsional.
   */
  updateCustomerBalance: async (customer_id, newBalance, conn = defaultConn) => {
    const query = `
      INSERT INTO customer_balances (customer_id, balance)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance)
    `;

    const [result] = await conn.execute(query, [customer_id, newBalance]);

    return result;
  },

  /**
   * Mengurangi saldo pelanggan jika saldo mencukupi.
   * Sebelum pengurangan, akan dicek saldo yang tersedia.
   * @param {number} customer_id - ID pelanggan.
   * @param {number} balanceUsed - Jumlah saldo yang akan dikurangi.
   * @param {import('mysql2/promise').PoolConnection} [conn] - Koneksi transaction opsional.
   */
  reduceCustomerBalance: async (customer_id, balanceUsed, conn = defaultConn) => {
    const query = `
      UPDATE customer_balances
      SET balance = balance - ?
      WHERE customer_id = ?`;

    const [result] = await conn.execute(query, [balanceUsed, customer_id]);

    return result;
  },

  /**
   * Mengambil daftar saldo semua pelanggan dari database.
   */
  getCustomersBalance: async () => {
    const query = `SELECT * FROM customer_balances`;

    const [results] = await defaultConn.execute(query);
    return results;
  },

  /**
   * Mengambil saldo pelanggan berdasarkan ID pelanggan.
   * @param {number} customer_id - ID pelanggan.
   * @param {import('mysql2/promise').PoolConnection} [conn] - Koneksi transaction opsional.
   */
  getCustomerBalanceById: async (customer_id, conn = defaultConn) => {
    const query = `SELECT balance FROM customer_balances WHERE customer_id = ?`;
    const [result] = await conn.execute(query, [customer_id]);

    return result[0] || null;
  },
};

export default CustomerBalance;
