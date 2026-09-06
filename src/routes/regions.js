import express from 'express';
const router = express.Router();
import {
  getAllRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  getAllSubRegions,
  createSubRegion,
  updateSubRegion,
  deleteSubRegion,
} from '../controllers/regionController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

// ----------------------------------------------------------------------------
// Sub-region routes didaftarkan DULUAN, sebelum GET/PUT/DELETE /:id di bawah -
// kalau kebalik, Express bakal nangkep "sub-regions" sebagai parameter :id.
// ----------------------------------------------------------------------------

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

/**
 * @route POST /regions/sub-regions
 * @desc Menambahkan sub-region baru (Admin only)
 */
router.post(
  '/sub-regions',
  authMiddleware,
  roleMiddleware(['Admin']),
  createSubRegion
);

/**
 * @route PUT /regions/sub-regions/:id
 * @desc Memperbarui sub-region (Admin only)
 */
router.put(
  '/sub-regions/:id',
  authMiddleware,
  roleMiddleware(['Admin']),
  updateSubRegion
);

/**
 * @route DELETE /regions/sub-regions/:id
 * @desc Menghapus sub-region (Admin only) - ditolak kalau masih dipakai pelanggan
 */
router.delete(
  '/sub-regions/:id',
  authMiddleware,
  roleMiddleware(['Admin']),
  deleteSubRegion
);

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
 * @route POST /regions
 * @desc Menambahkan region baru (Admin only)
 */
router.post('/', authMiddleware, roleMiddleware(['Admin']), createRegion);

/**
 * @route PUT /regions/:id
 * @desc Memperbarui region (Admin only)
 */
router.put('/:id', authMiddleware, roleMiddleware(['Admin']), updateRegion);

/**
 * @route DELETE /regions/:id
 * @desc Menghapus region (Admin only) - ditolak kalau masih punya sub-region
 */
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), deleteRegion);

export default router;
