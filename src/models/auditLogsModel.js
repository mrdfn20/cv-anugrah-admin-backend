import dbConnection from '../config/db.js';

class AuditLogsModel {
  static async logAction({
    userId,
    role,
    action,
    endpoint,
    requestData,
    previousData,
    ipAddress,
  }) {
    const query = `
      INSERT INTO audit_logs (user_id, role, action, endpoint, request_data, previous_data, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await dbConnection
      .promise()
      .execute(query, [
        userId,
        role,
        action,
        endpoint,
        JSON.stringify(requestData),
        JSON.stringify(previousData),
        ipAddress,
      ]);
  }

  static async getAllLogs() {
    const query = `SELECT * FROM audit_logs ORDER BY timestamp DESC`;
    const [results] = await dbConnection.promise().execute(query);
    return results;
  }
}

export default AuditLogsModel;
