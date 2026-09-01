import moment from 'moment-timezone';
import ReportsService from '../services/reportsService.js';
import {
  successResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

export const getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const validationErrors = [];
    if (!startDate || !endDate) {
      validationErrors.push('startDate dan endDate wajib diisi');
    } else {
      if (!moment(startDate, 'YYYY-MM-DD', true).isValid()) {
        validationErrors.push('Format startDate harus YYYY-MM-DD');
      }
      if (!moment(endDate, 'YYYY-MM-DD', true).isValid()) {
        validationErrors.push('Format endDate harus YYYY-MM-DD');
      }
      if (
        moment(startDate, 'YYYY-MM-DD', true).isValid() &&
        moment(endDate, 'YYYY-MM-DD', true).isValid() &&
        moment(startDate).isAfter(moment(endDate))
      ) {
        validationErrors.push('startDate tidak boleh setelah endDate');
      }
    }

    if (validationErrors.length > 0) {
      return validationErrorResponse(res, validationErrors);
    }

    const summary = await ReportsService.getSummaryByPeriod(startDate, endDate);

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

export default { getSummary };
