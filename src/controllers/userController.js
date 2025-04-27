import UserService from '../services/userService.js';

class UserController {
  async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      return res.json(users);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const { username, password } = req.body;
      const result = await UserService.deleteUser({ username, password });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}

export default new UserController();
