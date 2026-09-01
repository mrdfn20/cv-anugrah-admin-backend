// src/controllers/auditLogController.js
import AuditLogsService from '../services/auditLogsService.js';
import {
  successResponse,
  validationErrorResponse,
  internalErrorResponse,
  createPaginationMeta,
} from '../helpers/responseHelper.js';

class AuditLogController {
  /**
   * Get audit logs, opsional search (username/role/aksi/endpoint) & pagination.
   * `page`/`limit` opsional - kalau gak dikirim, balikin semua log (perilaku lama).
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getLogs(req, res) {
    const { search, page, limit } = req.query;

    try {
      if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
        return validationErrorResponse(res, ['page harus angka >= 1']);
      }
      if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1)) {
        return validationErrorResponse(res, ['limit harus angka >= 1']);
      }

      const results = await AuditLogsService.getLogs({ search, page, limit });

      const isPaginated = limit && results && !Array.isArray(results);
      const logs = isPaginated ? results.data : results;
      const meta = isPaginated
        ? createPaginationMeta(results.total, parseInt(page) || 1, parseInt(limit))
        : null;

      if (!logs || logs.length === 0) {
        return successResponse(res, 'No audit logs found', [], meta, 200);
      }

      return successResponse(
        res,
        'Audit logs retrieved successfully',
        logs,
        meta,
        200
      );
    } catch (error) {
      console.error('[AUDIT LOGS ERROR]', error);
      return internalErrorResponse(res, 'Gagal mengambil audit logs', error);
    }
  }
}

export default AuditLogController;
