import express from 'express';
const router = express.Router();
import {
  addTransaction as addTransactionController,
  getAllTransactions as getAllTransactionsController,
  getTransactionById as getTransactionByIdController,
  getTransactionByCustomerId as getTransactionByCustomerIdController,
  getTransactionsByFilter as getTransactionsByFilterController,
  deleteTransaction as deleteTransactionController,
  restoreTransaction as restoreTransactionController,
} from '../controllers/transactionsController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

/**
 * @route POST /transactions
 * @desc Menambahkan transaksi baru
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  addTransactionController
);

/**
 * @route DELETE /transactions/:id
 * @desc Menghapus transaksi berdasarkan ID (soft delete)
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  deleteTransactionController
);

/**
 * @route PUT /transactions/restore/:id
 * @desc Mengembalikan transaksi yang telah dihapus
 */
router.put(
  '/restore/:id',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  restoreTransactionController
);

/**
 * @route GET /transactions/filter
 * @desc Mengambil transaksi berdasarkan filter (id pelanggan, nama pelanggan, id transaksi, subregionId, subregionname, rentang tanggal transaksi)
 */
router.get(
  '/filter',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor', 'Driver']),
  getTransactionsByFilterController
);

/**
 * @route GET /transactions/customer/:id
 * @desc Mengambil transaksi berdasarkan ID pelanggan
 */
router.get(
  '/customer/:id',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  getTransactionByCustomerIdController
);

/**
 * @route GET /transactions/:id
 * @desc Mengambil transaksi berdasarkan ID transaksi
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  getTransactionByIdController
);

/**
 * @route GET /transactions
 * @desc Mengambil semua transaksi
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  getAllTransactionsController
);

export default router;
