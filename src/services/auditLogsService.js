import AuditLogsModel from '../models/auditLogsModel.js';

class AuditLogsService {
  static async getLogs({ search, page, limit } = {}) {
    return await AuditLogsModel.getLogs({ search, page, limit });
  }
}

export default AuditLogsService;
