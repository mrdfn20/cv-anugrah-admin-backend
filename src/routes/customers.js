import express from 'express';
const router = express.Router();
import {
  getAllCustomers,
  getCustomerById,
  addCustomer,
  deleteCustomerById,
  restoreCustomerById,
  getDeletedCustomers,
  getActivitySummary,
  updateCustomerById,
  // patchCustomerById,
} from '../controllers/customersController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

/** 
 * @route GET /customers
 * @desc Mengambil semua pelanggan
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor', 'Driver']),
  getAllCustomers
);

/**
 * @route GET /customers/activity-summary
 * @desc Ringkasan pelanggan aktif/tidak aktif transaksi bulan ini
 * @note Harus didaftarkan sebelum GET /:id, kalau tidak Express bakal
 * nangkep "activity-summary" sebagai parameter :id.
 */
router.get(
  '/activity-summary',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor', 'Driver']),
  getActivitySummary
);

/**
 * @route GET /customers/deleted
 * @desc Mengambil pelanggan yang sudah dihapus (soft delete) - buat fitur restore
 * @note Harus didaftarkan sebelum GET /:id, kalau tidak Express bakal
 * nangkep "deleted" sebagai parameter :id.
 */
router.get(
  '/deleted',
  authMiddleware,
  roleMiddleware(['Admin']),
  getDeletedCustomers
);

/**
 * @route PUT /customers/restore/:id
 * @desc Mengembalikan pelanggan yang sudah dihapus (soft delete)
 * @note Harus didaftarkan sebelum GET /:id (beda method sebenernya gak
 * bentrok, tapi konsisten sama pola transactions.js).
 */
router.put(
  '/restore/:id',
  authMiddleware,
  roleMiddleware(['Admin']),
  restoreCustomerById
);

/**
 * @route GET /customers/:id
 * @desc Mengambil pelanggan berdasarkan ID
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor', 'Driver']),
  getCustomerById
);

/**
 * @route POST /customers
 * @desc Menambahkan pelanggan baru
 */
router.post('/', authMiddleware, roleMiddleware(['Admin']), addCustomer);

/**
 * @route PUT /customers/:id
 * @desc Memperbarui pelanggan (full update)
 */
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['Admin']),
  updateCustomerById
);

// /**
//  * @route PATCH /customers/:id
//  * @desc Memperbarui pelanggan (partial update)
//  */
// router.patch(
//   '/:id',
//   authMiddleware,
//   roleMiddleware(['Admin']),
//   patchCustomerById
// );

/**
 * @route DELETE /customers/:id
 * @desc Menghapus pelanggan berdasarkan ID
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['Admin']),
  deleteCustomerById
);

export default router;
