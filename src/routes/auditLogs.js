import express from 'express';
import AuditLogController from '../controllers/auditLogController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin']),
  AuditLogController.getLogs
);
  
export default router;
