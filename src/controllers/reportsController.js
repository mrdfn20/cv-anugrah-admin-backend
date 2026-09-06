import moment from 'moment-timezone';
import ReportsService from '../services/reportsService.js';
import {
  successResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

function validateDateRange(startDate, endDate) {
  const errors = [];
  if (!startDate || !endDate) {
    errors.push('startDate dan endDate wajib diisi');
    return errors;
  }
  if (!moment(startDate, 'YYYY-MM-DD', true).isValid()) {
    errors.push('Format startDate harus YYYY-MM-DD');
  }
  if (!moment(endDate, 'YYYY-MM-DD', true).isValid()) {
    errors.push('Format endDate harus YYYY-MM-DD');
  }
  if (
    errors.length === 0 &&
    moment(startDate).isAfter(moment(endDate))
  ) {
    errors.push('startDate tidak boleh setelah endDate');
  }
  return errors;
}

export const getSummary = async (req, res) => {
  try {
    const { startDate, endDate, customerId } = req.query;

    const validationErrors = validateDateRange(startDate, endDate);
    if (customerId && isNaN(parseInt(customerId))) {
      validationErrors.push('customerId harus berupa angka');
    }
    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }

    const summary = await ReportsService.getSummaryByPeriod(
      startDate,
      endDate,
      customerId ? parseInt(customerId) : undefined
    );

    return successResponse(
      res,
      'Report summary retrieved successfully',
      summary,
      null,
      200
    );
  } catch (error) {
    console.error('[GET REPORT SUMMARY ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil ringkasan laporan', error);
  }
};

export const getSummaryByRegion = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const validationErrors = validateDateRange(startDate, endDate);
    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }

    const summary = await ReportsService.getSummaryByRegion(startDate, endDate);

    return successResponse(
      res,
      'Region report summary retrieved successfully',
      summary,
      null,
      200
    );
  } catch (error) {
    console.error('[GET REPORT SUMMARY BY REGION ERROR]', error);
    return internalErrorResponse(
      res,
      'Gagal mengambil ringkasan laporan per wilayah',
      error
    );
  }
};

export default { getSummary, getSummaryByRegion };
