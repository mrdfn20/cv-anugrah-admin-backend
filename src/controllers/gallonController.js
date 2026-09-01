import GallonService from '../services/gallonService.js';

import moment from 'moment-timezone';
import {
  successResponse,
  validationErrorResponse,
  notFoundErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

export const getGallonPriceByCustomerId = async (req, res) => {
  const customer_id = req.params.customer_id;

  try {
    const results = await GallonService.getGallonPriceByCustomerId(customer_id);

    if (!results) {
      return notFoundErrorResponse(res, 'Customer or gallon price');
    }

    return successResponse(
      res,
      'Gallon price retrieved successfully',
      { customer_id, gallon_price: results.price },
      null,
      200
    );
  } catch (error) {
    console.error('[GET GALLON PRICE ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil harga galon', error);
  }
};

export const getCustomersGallonsStockRecap = async (req, res) => {
  try {
    const results = await GallonService.getCustomersGallonsStockRecap();
    return successResponse(
      res,
      'Gallon stock recap retrieved successfully',
      results,
      null,
      200
    );
  } catch (error) {
    console.error('[GET GALLON STOCK RECAP ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil rekap stok galon', error);
  }
};

export const getCustomerGallonsStockRecapByCustomerId = async (req, res) => {
  const { customer_id } = req.params;

  try {
    const result = await GallonService.getCustomerGallonsStockRecapByCustomerId(
      customer_id
    );

    if (!result) {
      return notFoundErrorResponse(res, 'Customer or transaction data');
    }

    return successResponse(
      res,
      'Gallon stock recap retrieved successfully',
      result,
      null,
      200
    );
  } catch (error) {
    console.error('[GET GALLON STOCK RECAP BY CUSTOMER ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil rekap stok galon pelanggan', error);
  }
};

export const getCustomersGallonsStockRecapByFilter = async (req, res) => {
  try {
    let {
      customer_id,
      customer_name,
      transaction_id,
      sub_region_id,
      sub_region_name,
      transaction_type,
      armada_id,
      startDate,
      endDate,
      stockLimit,
      sortBy,
      sortOrder,
    } = req.query;

    // ✅ Validasi minimal 1 filter
    const hasAnyFilter = [
      customer_id,
      customer_name,
      transaction_id,
      sub_region_id,
      sub_region_name,
      transaction_type,
      armada_id,
      startDate,
      endDate,
      stockLimit,
      sortBy,
      sortOrder,
    ].some((val) => val !== undefined);

    if (!hasAnyFilter) {
      return validationErrorResponse(res, ['Please provide at least one filter']);
    }

    // ✅ Validasi numerik
    const validationErrors = [];
    if (customer_id && isNaN(parseInt(customer_id))) {
      validationErrors.push('Invalid customer_id parameter');
    }

    if (transaction_id && isNaN(parseInt(transaction_id))) {
      validationErrors.push('Invalid transaction_id parameter');
    }

    if (sub_region_id && isNaN(parseInt(sub_region_id))) {
      validationErrors.push('Invalid sub_region_id parameter');
    }

    if (
      transaction_type &&
      transaction_type !== 'Tunai' &&
      transaction_type !== 'Hutang'
    ) {
      validationErrors.push('Invalid status');
    }

    if (armada_id && isNaN(parseInt(armada_id))) {
      validationErrors.push('Invalid armada_id parameter');
    }

    // ✅ Validasi tanggal
    if (
      (startDate && !moment(startDate, 'YYYY-MM-DD', true).isValid()) ||
      (endDate && !moment(endDate, 'YYYY-MM-DD', true).isValid())
    ) {
      validationErrors.push('Format tanggal tidak valid. Gunakan YYYY-MM-DD');
    }

    if (stockLimit && isNaN(parseInt(stockLimit))) {
      validationErrors.push('Invalid stockLimit parameter');
    }

    // ✅ Validasi sortBy dan sortOrder
    const allowedSortColumns = [
      'customer_id',
      'customer_name',
      'sub_region_name',
      'unreturned_gallons',
    ];
    if (sortBy && !allowedSortColumns.includes(sortBy)) {
      validationErrors.push('Invalid sortBy parameter');
    }

    const allowedSortOrder = ['ASC', 'DESC'];
    if (sortOrder && !allowedSortOrder.includes(sortOrder.toUpperCase())) {
      validationErrors.push('Invalid sortOrder parameter');
    }

    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }

    // ✅ Format & normalisasi nama
    if (customer_name && typeof customer_name === 'string') {
      customer_name = decodeURI(customer_name.toUpperCase());
    }

    // ✅ Ambil hasil
    const results = await GallonService.getCustomersGallonsStockRecapByFilter(
      customer_id,
      customer_name,
      transaction_id,
      sub_region_id,
      sub_region_name,
      transaction_type,
      armada_id,
      startDate,
      endDate,
      stockLimit,
      sortBy,
      sortOrder?.toUpperCase()
    );

    if (!results.length) {
      return successResponse(res, 'No data found', [], null, 200);
    }

    return successResponse(
      res,
      'Filtered gallon stock recap retrieved successfully',
      results,
      null,
      200
    );
  } catch (error) {
    console.error('[GET GALLON STOCK RECAP BY FILTER ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil rekap stok galon dengan filter', error);
  }
};
