import UserService from '../services/userService.js';
import User from '../models/userModel.js';
import {
  successResponse,
  validationErrorResponse,
  notFoundErrorResponse,
  forbiddenErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

class UserController {
  async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      return successResponse(res, 'Users retrieved successfully', users, null, 200);
    } catch (error) {
      console.error('[GET ALL USERS ERROR]', error);
      return internalErrorResponse(res, 'Gagal mengambil data user', error);
    }
  }

  async deleteUser(req, res) {
    try {
      const { username } = req.body;

      if (!username) {
        return validationErrorResponse(res, ['Username wajib diisi']);
      }

      // Cegah Admin menghapus akun dirinya sendiri lewat halaman ini
      const target = await User.getUserByUsername(username);
      if (!target) {
        return notFoundErrorResponse(res, 'User');
      }
      if (req.user && target.id === req.user.id) {
        return forbiddenErrorResponse(
          res,
          'Tidak bisa menghapus akun sendiri'
        );
      }

      const result = await UserService.deleteUser({ username });
      return successResponse(res, result.message, { username }, null, 200);
    } catch (error) {
      console.error('[DELETE USER ERROR]', error);

      if (error.message === 'User not found') {
        return notFoundErrorResponse(res, 'User');
      }

      return internalErrorResponse(res, 'Gagal menghapus user', error);
    }
  }
}

export default new UserController();
