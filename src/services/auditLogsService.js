import AuditLogsModel from '../models/auditLogsModel.js';

class AuditLogsService {
  static async getLogs({ search, role, page, limit } = {}) {
    return await AuditLogsModel.getLogs({ search, role, page, limit });
  }
}

export default AuditLogsService;
