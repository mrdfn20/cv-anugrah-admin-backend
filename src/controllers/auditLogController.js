import AuditLogsService from '../services/auditLogsService.js';

class AuditLogController {
  static async getLogs(req, res) {
    try {
      const logs = await AuditLogsService.getAllLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default AuditLogController;
