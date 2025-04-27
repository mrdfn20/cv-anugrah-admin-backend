import express from 'express';
const router = express.Router();
import {
  getAllCustomers,
  getCustomerById,
  addCustomer,
  deleteCustomerById,
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
