import express from 'express';
import {
  getGallonPriceByCustomerId as getGallonPriceByCustomerIdController,
  getCustomersGallonsStockRecap as getCustomersGallonsStockRecapController,
  getCustomerGallonsStockRecapByCustomerId as getCustomerGallonsStockRecapByCustomerIdController,
  getCustomersGallonsStockRecapByFilter as getCustomersGallonsStockRecapByFilterController,
} from '../controllers/gallonController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Ambil rekap stok galon berdasarkan filter query
 */
router.get(
  '/stock/filter',
  authMiddleware,
  getCustomersGallonsStockRecapByFilterController
);

/**
 * Ambil semua rekap stok galon
 */
router.get('/stock', authMiddleware, getCustomersGallonsStockRecapController);

/**
 * Ambil rekap stok galon berdasarkan customer ID
 */
router.get(
  '/stock/:customer_id',
  authMiddleware,
  getCustomerGallonsStockRecapByCustomerIdController
);

/**
 * Ambil harga galon berdasarkan customer ID
 */
router.get(
  '/price/:customer_id',
  authMiddleware,
  getGallonPriceByCustomerIdController
);

export default router;
