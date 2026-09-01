import GallonMovementsService from '../services/gallonMovementsService.js';
import {
  successResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

/**
 * Mendapatkan histori pergerakan galon untuk seluruh pelanggan
 */
export const getAllGallonMovements = async (req, res) => {
  try {
    const { grouped } = req.query;
    const isGrouped = grouped === 'true'; // parse boolean

    const results = await GallonMovementsService.getAllMovements(isGrouped); // 🧠 pass opsi

    return successResponse(
      res,
      'Gallon movements retrieved successfully',
      results,
      null,
      200
    );
  } catch (error) {
    console.error('[GET ALL GALLON MOVEMENTS ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data pergerakan galon', error);
  }
};

/**
 * Mendapatkan histori pergerakan galon untuk satu pelanggan
 */
export const getGallonMovementsByCustomer = async (req, res) => {
  const { customer_id } = req.params;

  if (!customer_id || isNaN(parseInt(customer_id))) {
    return validationErrorResponse(res, ['Invalid customer ID']);
  }

  try {
    const results = await GallonMovementsService.getMovementsByCustomerId(customer_id);

    // Belum ada pergerakan galon itu kondisi normal (pelanggan baru), bukan error.
    return successResponse(
      res,
      results && results.length > 0
        ? 'Gallon movements retrieved successfully'
        : 'No gallon movements found for this customer',
      results || [],
      null,
      200
    );
  } catch (error) {
    console.error('[GET GALLON MOVEMENTS BY CUSTOMER ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data pergerakan galon pelanggan', error);
  }
};
