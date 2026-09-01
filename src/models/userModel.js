import dbConnection from '../config/db.js';

class User {
  static async createUser(username, password, role) {
    const query =
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    const [results] = await dbConnection
      .promise()
      .execute(query, [username, password, role]);
    return results;
  }

  static async getUserByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ? LIMIT 1';
    const [results] = await dbConnection.promise().execute(query, [username]);
    return results[0];
  }

  static async getUserById(id) {
    const query = `SELECT * FROM users WHERE id = ? LIMIT 1`;
    const [results] = await dbConnection.promise().execute(query, [id]);
    return results[0];
  }

  static async getAllUsers() {
    // Jangan SELECT * - kolom password (bcrypt hash) tidak boleh ikut terbawa
    // ke response API manapun.
    const query = 'SELECT id, username, role, created_at FROM users';
    const [results] = await dbConnection.promise().execute(query);
    return results;
  }

  static async deleteUser(username) {
    const query = 'DELETE FROM users WHERE username=?';
    const [results] = await dbConnection.promise().execute(query, [username]);
    return results;
  }
}

export default User;
