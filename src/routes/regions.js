import express from 'express';
const router = express.Router();
import { getAllRegions, getAllSubRegions } from '../controllers/regionController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

/**
 * @route GET /regions
 * @desc Mengambil semua region (kecamatan) - buat dropdown filter/form
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor', 'Driver']),
  getAllRegions
);

/**
 * @route GET /regions/sub-regions
 * @desc Mengambil semua sub-region (kompleks/desa) beserta nama region induknya
 */
router.get(
  '/sub-regions',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor', 'Driver']),
  getAllSubRegions
);

export default router;
