// routes/gallonmovements.js
import express from 'express';
const router = express.Router();

import {
  getAllGallonMovements as getAllGallonMovementsController,
  getGallonMovementsByCustomer as getGallonMovementsByCustomerController,
} from '../controllers/gallonMovementsController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

/**
 * @route GET /gallonmovements
 * @desc Menampilkan semua pergerakan galon (opsi grouped=true untuk hasil grouped)
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  getAllGallonMovementsController
);

// ✅ Ambil histori pergerakan galon berdasarkan customer_id
router.get(
  '/:customer_id',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  getGallonMovementsByCustomerController
);

export default router;
