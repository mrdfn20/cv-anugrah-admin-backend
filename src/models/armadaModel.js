import dbConnection from '../config/db.js';

const ArmadaModel = {
  async getAll() {
    const query = `SELECT id, armada_name FROM armadas ORDER BY id`;
    const [results] = await dbConnection.promise().execute(query);
    return results;
  },

  async getById(id) {
    const query = `SELECT id, armada_name FROM armadas WHERE id = ?`;
    const [results] = await dbConnection.promise().execute(query, [id]);
    return results[0] || null;
  },

  async create(armada_name) {
    const query = `INSERT INTO armadas (armada_name) VALUES (?)`;
    const [result] = await dbConnection.promise().execute(query, [armada_name]);
    return result.insertId;
  },

  async update(id, armada_name) {
    const query = `UPDATE armadas SET armada_name = ? WHERE id = ?`;
    const [result] = await dbConnection
      .promise()
      .execute(query, [armada_name, id]);
    return result;
  },

  async delete(id) {
    const query = `DELETE FROM armadas WHERE id = ?`;
    const [result] = await dbConnection.promise().execute(query, [id]);
    return result;
  },

  /**
   * Hitung berapa transaksi yang masih referensi armada ini - dipakai
   * sebagai guard sebelum hapus, supaya data transaksi lama gak jadi yatim.
   */
  async countTransactionsUsingArmada(id) {
    const query = `SELECT COUNT(*) AS total FROM transactions WHERE armada_id = ?`;
    const [results] = await dbConnection.promise().execute(query, [id]);
    return Number(results[0].total) || 0;
  },
};

export default ArmadaModel;
