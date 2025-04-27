import express from 'express';
const router = express.Router();

import DashboardController from '../controllers/dashboardController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

// 🔓 Dashboard bisa diakses oleh Admin & Editor
router.get(
  '/summary',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  DashboardController.getSummary
);
router.get(
  '/income-summary',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  DashboardController.getIncomeSummary
);
router.get(
  '/gallon-summary',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  DashboardController.getGallonSummary
);
router.get(
  '/active-customers',  
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  DashboardController.getActiveCustomers
);
router.get(
  '/debt-status',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  DashboardController.getDebtStatus
);
router.get(
  '/today-activity',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  DashboardController.getTodayActivity
);

export default router;
