import dbConnection from '../config/db.js';

class RefreshTokenModel {
  // ✅ Simpan refresh token ke database
  static async saveToken(userId, token) {
    const query = `INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)`;
    await dbConnection.promise().execute(query, [userId, token]);
  }

  // ✅ Cek apakah refresh token valid
  static async findToken(token) {
    const query = `SELECT * FROM refresh_tokens WHERE token = ?`;
    const [results] = await dbConnection.promise().execute(query, [token]);
    return results;
  }

  static async findTokenByUserId(userId) {
    const query = `SELECT * FROM refresh_tokens WHERE user_id = ?`;
    const [results] = await dbConnection.promise().execute(query, [userId]);
    return results.length ? results[0] : null;
  }

  // ✅ Hapus refresh token (saat logout)
  static async deleteToken(token) {
    const query = `DELETE FROM refresh_tokens WHERE token = ?`;
    await dbConnection.promise().execute(query, [token]);
  }

  // ✅ Hapus semua refresh token user (opsional, saat user reset password)
  static async deleteTokensByUser(userId) {
    const query = `DELETE FROM refresh_tokens WHERE user_id = ?`;
    await dbConnection.promise().execute(query, [userId]);
  }
}

export default RefreshTokenModel;
