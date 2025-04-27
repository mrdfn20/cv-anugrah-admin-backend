import authController from '../controllers/authController.js';
import express from 'express';

import { loginLimiter } from '../middlewares/rateLimiterMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.post(
  '/register',
  authMiddleware,
  roleMiddleware(['Admin']),
  authController.register
);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
