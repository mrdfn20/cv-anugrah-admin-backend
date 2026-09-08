import express from 'express';
const router = express.Router();

import DashboardController from '../controllers/dashboardController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import { cacheMiddleware } from '../middlewares/cacheMiddleware.js';

// 🆕 Cache 30 detik - endpoint2 ini query aggregate yang lumayan berat, dan hasilnya
// sama buat semua user (Admin/Editor manapun yang buka Dashboard liat angka yang sama).
// Dipasang SETELAH auth/role (biar tetap ke-cek otorisasinya), SEBELUM controller.
const dashboardCache = cacheMiddleware(30);

// 🔓 Dashboard bisa diakses oleh Admin & Editor
router.get(
  '/summary',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  dashboardCache,
  DashboardController.getSummary
);
router.get(
  '/income-summary',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  dashboardCache,
  DashboardController.getIncomeSummary
);
router.get(
  '/gallon-summary',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  dashboardCache,
  DashboardController.getGallonSummary
);
router.get(
  '/active-customers',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  dashboardCache,
  DashboardController.getActiveCustomers
);
router.get(
  '/debt-status',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  dashboardCache,
  DashboardController.getDebtStatus
);
router.get(
  '/today-activity',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  dashboardCache,
  DashboardController.getTodayActivity
);

// 🆕 Dashboard Driver ("Ringkasan Hari Ini") - Driver only, datanya scoped ke
// req.user.id sendiri (Anto gak bisa lihat punya Aan). SENGAJA gak dipasang
// dashboardCache di sini - cache-nya di-key dari originalUrl doang (bukan per-user),
// kalau dipasang, Driver yang buka duluan bakal "membocorkan" angkanya ke Driver lain
// yang buka endpoint yang sama dalam 30 detik. Lihat cacheMiddleware.js.
router.get(
  '/driver-summary',
  authMiddleware,
  roleMiddleware(['Driver']),
  DashboardController.getDriverSummary
);

export default router;
