import express from 'express';
const router = express.Router();
import {
  getCustomersBalance as getCustomersBalanceController,
  getCustomerBalanceById as getCustomerBalanceByIdController,
  updateCustomerBalance as updateCustomerBalanceController,
  addCustomerBalance as addCustomerBalanceController,
} from '../controllers/customerBalanceController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

/**
 * @route POST /customerbalance
 * @desc Menambahkan saldo pelanggan baru
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  addCustomerBalanceController
);

/**
 * @route PUT /customerbalance
 * @desc Memperbarui saldo pelanggan
 */
router.put(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  updateCustomerBalanceController
);

/**
 * @route GET /customerbalance/:id
 * @desc Mengambil saldo pelanggan berdasarkan ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor', 'Driver']),
  getCustomerBalanceByIdController
);

/**
 * @route GET /customerbalance
 * @desc Mengambil semua saldo pelanggan
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  getCustomersBalanceController
);

export default router;
