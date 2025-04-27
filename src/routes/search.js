// routes/search.js
import express from 'express';
import SearchController from '../controllers/searchController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['Admin', 'Editor']),
  SearchController.search
);

export default router;
