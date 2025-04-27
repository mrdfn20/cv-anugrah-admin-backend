import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import RefreshTokenModel from '../models/refreshTokenModel.js';

class AuthService {
  /**
   * ✅ Register user baru
   * @param {string} username - Username unik user
   * @param {string} password - Password user (akan di-hash)
   * @param {string} role - Role user (Admin, Editor, Driver)
   * @returns {object} Data user baru yang dibuat
   */
  async register({ username, password, role }) {
    try {
      // Cek apakah user sudah ada

      const existingUser = await User.getUserByUsername(username);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password sebelum disimpan
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await User.createUser(username, hashedPassword, role);
      return newUser;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * ✅ Login user & generate JWT token
   * @param {string} username - Username user
   * @param {string} password - Password user
   * @returns {string} JWT token
   */
  async login({ username, password }) {
    try {
      // Cari user berdasarkan username
      const user = await User.getUserByUsername(username);
      if (!user) {
        throw new Error('User not found');
      }

      // Cek password dengan hash di database
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        throw new Error('Wrong password');
      }

      // Generate JWT token dengan payload id & role
      const accessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // ✅ Token berlaku 1 jam
      );

      const refreshToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '3d' }
      );

      // Sebelum menyimpan refresh token baru, hapus yang lama
      await RefreshTokenModel.deleteTokensByUser(user.id);

      // ✅ Simpan refresh token ke DB
      await RefreshTokenModel.saveToken(user.id, refreshToken);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) throw new Error('No refresh token provided');

    // ✅ Cari token di database
    const storedToken = await RefreshTokenModel.findToken(refreshToken);
    if (!storedToken) throw new Error('Invalid refresh token');

    // ✅ Verifikasi refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const userId = decoded.id;

    //  Ambil user untuk role, jika perlu
    const user = await User.getUserById(userId);

    // ✅ Buat access token baru
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return newAccessToken;
  }

  async logout(refreshToken) {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }

    const tokenInDB = await RefreshTokenModel.findToken(refreshToken);

    if (!tokenInDB || tokenInDB.length === 0) {
      throw new Error('Invalid or already logged out');
    }

    await RefreshTokenModel.deleteToken(refreshToken);
    return null;
  }
}

// ✅ Menggunakan instansiasi class agar bisa langsung dipakai
export default new AuthService();
