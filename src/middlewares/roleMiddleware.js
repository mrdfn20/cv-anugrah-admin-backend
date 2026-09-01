import { errorResponse } from '../helpers/responseHelper.js';

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {

      // ✅ Pastikan `req.user` tersedia setelah verifikasi JWT
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return errorResponse(res, 'Forbidden: You do not have access', null, 403);
      }

      next(); // ✅ Lanjut ke controller jika role sesuai
    } catch (error) {
      return errorResponse(res, 'Role verification failed', error.message, 500);
    }
  };
};

export default roleMiddleware;
