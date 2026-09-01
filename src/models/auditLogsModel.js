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

  /**
   * Mengambil audit log, opsional dgn pencarian (username/role/aksi/endpoint) & pagination.
   * `page`/`limit` OPSIONAL - kalau gak dikirim, balikin SEMUA log (perilaku lama).
   * @param {{ search?: string, page?: number, limit?: number }} params
   */
  static async getLogs({ search, page, limit } = {}) {
    const whereClauses = [];
    const queryParams = [];

    if (search) {
      whereClauses.push(
        '(u.username LIKE ? OR audit_logs.role LIKE ? OR audit_logs.action LIKE ? OR audit_logs.endpoint LIKE ?)'
      );
      const like = `%${search}%`;
      queryParams.push(like, like, like, like);
    }

    const fromAndWhere = `
      FROM audit_logs
      LEFT JOIN users u ON audit_logs.user_id = u.id
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
    `;

    let query = `SELECT audit_logs.* ${fromAndWhere} ORDER BY audit_logs.timestamp DESC`;
    const selectParams = [...queryParams];

    let total = null;
    if (limit) {
      const countQuery = `SELECT COUNT(*) AS total ${fromAndWhere}`;
      const [countResult] = await dbConnection
        .promise()
        .execute(countQuery, queryParams);
      total = countResult[0].total;

      const safePage = Math.max(parseInt(page) || 1, 1);
      const safeLimit = Math.max(parseInt(limit) || 15, 1);
      const offset = (safePage - 1) * safeLimit;
      // LIMIT/OFFSET diselipkan langsung, bukan lewat placeholder `?` - lihat catatan di
      // transactionsModel.js (mysql2 .execute() gak konsisten binding integer LIMIT/OFFSET
      // antar versi MySQL). Aman krn safeLimit/offset sudah integer positif tervalidasi.
      query += ` LIMIT ${safeLimit} OFFSET ${offset}`;
    }

    const [results] = await dbConnection.promise().execute(query, selectParams);
    return limit ? { data: results, total } : results;
  }
}

export default AuditLogsModel;
