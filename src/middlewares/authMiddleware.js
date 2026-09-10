import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const authMiddleware = (req, res, next) => {
  try {
    // ✅ Ambil token dari header `Authorization`
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1]; // Ambil token setelah "Bearer"

    // ✅ Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ✅ Tambahkan user ke `req` agar bisa diakses di endpoint lain

    next(); // ✅ Lanjut ke middleware/endpoint berikutnya
  } catch (err) {
    // 🆕 Token yang cuma KEDALUWARSA (expired, normal tiap 1 jam) dibalikin 401,
    // BUKAN 403 - biar interceptor di frontend (api.js) yang cuma nanganin 401 bisa
    // otomatis nembak refresh-token & ngulang request-nya. Sebelumnya semua kasus
    // (termasuk expired) dibalikin 403, jadi frontend gak pernah nyoba refresh dan
    // user kelempar keluar tiap 1 jam walau refresh token-nya (3 hari) masih valid.
    // 403 tetap dipakai buat token yang beneran RUSAK/dipalsukan (signature salah dll).
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token expired' });
    }
    return res.status(403).json({ message: 'Forbidden: Invalid token' });
  }
};

export default authMiddleware;
