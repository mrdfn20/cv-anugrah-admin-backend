import express from 'express';
import ReportsController from '../controllers/reportsController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @route GET /reports/summary
 * @desc Ringkasan transaksi dalam satu rentang tanggal (startDate, endDate)
 */
router.get(
  '/summary',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  ReportsController.getSummary
);

/**
 * @route GET /reports/summary-by-region
 * @desc Ringkasan omzet & hutang per wilayah (kecamatan) dalam satu rentang tanggal
 */
router.get(
  '/summary-by-region',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  ReportsController.getSummaryByRegion
);

export default router;
