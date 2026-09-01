import User from '../models/userModel.js';

class UserService {
  async getAllUsers() {
    try {
      const results = await User.getAllUsers();
      return results;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getUserById(id) {
    try {
      const user = await User.getUserById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deleteUser({ username }) {
    try {
      const user = await User.getUserByUsername(username);
      if (!user) {
        throw new Error('User not found');
      }

      // Otorisasi sudah ditangani roleMiddleware(['Admin']) di route -
      // tidak perlu re-konfirmasi password (Admin tidak mungkin tahu
      // plaintext password user lain).
      await User.deleteUser(username);
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default new UserService();
