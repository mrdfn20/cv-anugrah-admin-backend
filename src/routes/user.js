import express from 'express';
import UserController from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin']),
  UserController.getAllUsers
);
router.delete(
  '/',
  authMiddleware,
  roleMiddleware(['Admin']),
  UserController.deleteUser
);

export default router;
