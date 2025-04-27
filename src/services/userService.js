import User from '../models/userModel.js';
import bcrypt from 'bcrypt';

class UserService {
  async getAllUsers() {
    try {
      const results = await User.getAllUsers();
      return results;
    } catch (error) {
      throw new error(error);
    }
  }

  async deleteUser({ username, password }) {
    try {
      const user = await User.getUserByUsername(username);
      if (!user) {
        throw new Error('User not found');
      }

      // Cek password dengan hash di database
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        throw new Error('Wrong password');
      }

      // Jika password cocok, hapus user
      await User.deleteUser(username);
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default new UserService();
