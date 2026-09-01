import express from 'express';
import ArmadaController from '../controllers/armadaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

/**
 * @route GET /armadas
 * @desc Mengambil semua armada - dibaca semua role krn dibutuhkan form Tambah Transaksi
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor', 'Driver']),
  ArmadaController.getAllArmadas
);

/**
 * @route POST /armadas
 * @desc Menambahkan armada baru (Admin only)
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Admin']),
  ArmadaController.createArmada
);

/**
 * @route PUT /armadas/:id
 * @desc Memperbarui nama armada (Admin only)
 */
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['Admin']),
  ArmadaController.updateArmada
);

/**
 * @route DELETE /armadas/:id
 * @desc Menghapus armada (Admin only) - ditolak kalau masih dipakai transaksi
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['Admin']),
  ArmadaController.deleteArmada
);

export default router;
