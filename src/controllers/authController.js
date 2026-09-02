// src/controllers/authController.js
import authService from '../services/authService.js';
import UserService from '../services/userService.js';
import {
  successResponse,
  validationErrorResponse,
  authErrorResponse,
  notFoundErrorResponse,
  conflictErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

const VALID_ROLES = ['Admin', 'Editor', 'Driver'];

// Opsi cookie refresh token - `secure: true` + `sameSite: 'none'` (default) cuma bisa
// di-set browser di context aman (HTTPS, atau `localhost` yang punya pengecualian khusus
// buat dev). Production/staging saat ini masih HTTP di alamat IP asli (belum ada
// domain+TLS) - browser bakal DIAM-DIAM nolak nyimpen cookie ini kalau tetap "secure:true"
// disitu, bikin refresh token gak pernah nyimpen & user ke-logout tiap ~1 jam.
// Set COOKIE_SECURE=false & COOKIE_SAMESITE=lax di .env production/staging sampai HTTPS
// siap (lihat README bagian Deployment) - default di sini TETAP aman (secure+none) kalau
// env var gak di-set, jadi local dev (FE:5173 -> BE:5000, beda origin, tapi lewat
// `localhost` yang browser anggap "secure context") gak kepengaruh sama sekali.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE !== 'false',
  sameSite: process.env.COOKIE_SAMESITE || 'none',
  path: '/',
};

class AuthController {
  /**
   * Register user baru
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      const { username, password, role } = req.body;

      // Basic validation
      if (!username || !password || !role) {
        return validationErrorResponse(res, [
          'Username, password, dan role harus diisi',
        ]);
      }

      if (!VALID_ROLES.includes(role)) {
        return validationErrorResponse(res, [
          `Role harus salah satu dari: ${VALID_ROLES.join(', ')}`,
        ]);
      }

      const user = await authService.register({ username, password, role });

      return successResponse(
        res,
        'User registered successfully',
        user,
        null,
        201
      );
    } catch (error) {
      console.error('[REGISTER ERROR]', error);

      if (error.message === 'User already exists') {
        return conflictErrorResponse(res, 'Username sudah digunakan');
      }

      return internalErrorResponse(res, 'Gagal mendaftarkan user', error);
    }
  }

  /**
   * Login user & return JWT
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Basic validation
      if (!username || !password) {
        return validationErrorResponse(res, [
          'Username dan password harus diisi',
        ]);
      }

      const { accessToken, refreshToken } = await authService.login({
        username,
        password,
      });

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 hari
      });

      return successResponse(
        res,
        'Login successful',
        { accessToken },
        null,
        200
      );
    } catch (error) {
      console.error('[LOGIN ERROR]', error);
      return authErrorResponse(
        res,
        'Login gagal. Periksa username dan password Anda'
      );
    }
  }

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return authErrorResponse(
          res,
          'Refresh token tidak ditemukan. Silakan login kembali'
        );
      }

      const newAccessToken = await authService.refreshAccessToken(refreshToken);

      return successResponse(
        res,
        'Access token refreshed successfully',
        { accessToken: newAccessToken },
        null,
        200
      );
    } catch (error) {
      console.error('[REFRESH TOKEN ERROR]', error);
      return authErrorResponse(
        res,
        'Gagal refresh token. Silakan login kembali'
      );
    }
  }

  /**
   * Verify token and return user data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verify(req, res) {
    try {
      // Token sudah diverifikasi oleh middleware, user data ada di req.user
      const userId = req.user.id;

      // Ambil data user terbaru dari database
      const user = await UserService.getUserById(userId);

      if (!user) {
        return notFoundErrorResponse(res, 'User');
      }

      return successResponse(
        res,
        'Token valid',
        {
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        },
        null,
        200
      );
    } catch (error) {
      console.error('[VERIFY TOKEN ERROR]', error);
      return authErrorResponse(res, 'Token verification failed');
    }
  }

  /**
   * Logout user and clear refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return authErrorResponse(res, 'Refresh token tidak ditemukan');
      }

      // Process logout in service
      const result = await authService.logout(refreshToken);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

      return successResponse(
        res,
        'Logout successful',
        { message: result },
        null,
        200
      );
    } catch (error) {
      console.error('[LOGOUT ERROR]', error);
      return internalErrorResponse(res, 'Gagal logout', error);
    }
  }
}

export default new AuthController();
