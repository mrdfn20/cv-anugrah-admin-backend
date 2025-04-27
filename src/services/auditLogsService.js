import AuditLogsModel from '../models/auditLogsModel.js';

class AuditLogsService {
  static async getAllLogs() {
    return await AuditLogsModel.getAllLogs();
  }
}

export default AuditLogsService;
