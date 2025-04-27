import authService from '../services/authService.js';
import { successResponse, errorResponse } from '../helpers/responseHelper.js';

class AuthController {
  /**
   * ✅ Register user baru
   */
  async register(req, res) {
    try {
      const { username, password, role } = req.body;

      const user = await authService.register({ username, password, role });
      return successResponse(res, 'User registered successfully', user, 201);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  /**
   * ✅ Login user & return JWT
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const { accessToken, refreshToken } = await authService.login({
        username,
        password,
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // untuk HTTPS
        sameSite: 'Strict',
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 hari
      });
      return successResponse(
        res,
        'Login successful',
        { accessToken: accessToken },
        200
      );
    } catch (error) {
      errorResponse(res, error);
    }
  }

  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new Error('Refresh token missing');

      const token = await authService.refreshAccessToken(refreshToken);
      console.log('Cookie Refresh Token:', token);

      return successResponse(
        res,
        'Access token refreshed successfully',
        { newAccessToken: token },
        200
      );
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        throw new Error('Refresh token not found in cookies');
      }

      // Lanjutkan ke service seperti biasa
      const result = await authService.logout(refreshToken);

      // Hapus refreshToken dari cookie
      res.clearCookie('refreshToken');

      return successResponse(
        res,
        'Logout successful',
        { message: result },
        200
      );
    } catch (error) {
      return errorResponse(res, error);
    }
  }
}

export default new AuthController();
