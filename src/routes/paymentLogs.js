import express from 'express';
const router = express.Router();
import {
  payDebt as payDebtController,
  getDebtsByfilter as getDebtsController,
  addPaymentLogs as addPaymentLogsController,
  getAllPaymentLogs as getAllPaymentLogsController,
  getPaymentLogById as getPaymentLogByIdController,
  getPaymentLogByTransactionId as getPaymentLogByTransactionIdController,
  getDeletedPaymentLogByTransactionId as getDeletedPaymentLogByTransactionIdController,
} from '../controllers/paymentLogsController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

/**
 * @route GET /paymentlogs/getdebts
 * @desc Mengambil daftar hutang berdasarkan filter (customer_id, startDate, endDate, status, dll.)
 */
router.get(
  '/getdebts',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor', 'Driver']),
  getDebtsController
);

/**
 * @route POST /paymentlogs/paydebt
 * @desc Membayar hutang berdasarkan transaction_id
 */
router.post(
  '/paydebt',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  payDebtController
);

/**
 * @route POST /paymentlogs
 * @desc Menambahkan log pembayaran
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  addPaymentLogsController
);

/**
 * @route GET /paymentlogs
 * @desc Mengambil semua log pembayaran
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  getAllPaymentLogsController
);

/**
 * @route GET /paymentlogs/:id
 * @desc Mengambil log pembayaran berdasarkan ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  getPaymentLogByIdController
);

/**
 * @route GET /paymentlogs/transaction/:transaction_id
 * @desc Mengambil log pembayaran berdasarkan transaction_id
 */
router.get(
  '/transaction/:id',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  getPaymentLogByTransactionIdController
);

/**
 * @route DELETE /paymentlogs/:transaction_id
 * @desc Menghapus log pembayaran berdasarkan transaction_id
 */
router.get(
  '/deleted/:transaction_id',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  getDeletedPaymentLogByTransactionIdController
);

export default router;
