import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // ⏱️ 5 menit
  max: 5, // ❌ Maksimal 5 kali percobaan login
  message: {
    message: 'Too many login attempts. Please try again after 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
