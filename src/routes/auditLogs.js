import express from 'express';
import AuditLogController from '../controllers/auditLogController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

// 🆕 Editor ikut diizinkan (bukan cuma Admin) - Editor yang sehari-hari review aktivitas
// Driver (transaksi/bayar-hutang/tambah-saldo yang diinput kurir di lapangan).
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  AuditLogController.getLogs
);

export default router;
