import AuditLog from '../models/auditLogsModel.js';
import dbConnection from '../config/db.js';

const logHelper = async (req, customOptions = {}) => {
  try {
    const { id: userId, role } = req.user; // ✅ Ambil langsung dari req.user
    const action = customOptions.action || determineAction(req.method);
    const endpoint = customOptions.endpoint || req.originalUrl;
    const requestData =
      customOptions.requestData ||
      (req.method === 'GET' ? req.query : req.body);
    const ipAddress =
      req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    let previousData = customOptions.previousData || null;

    // Ambil data sebelumnya jika DELETE / PUT & belum disediakan
    if (!previousData && (req.method === 'DELETE' || req.method === 'PUT')) {
      previousData = await getPreviousData(req);
    }

    // ✅ Kirim ke model AuditLog
    await AuditLog.logAction({
      userId,
      role,
      action,
      endpoint,
      requestData,
      previousData,
      ipAddress,
    });
  } catch (error) {
    console.error('[LOGGING FAILED]', error.message);
  }
};

// Mapping method ke action
const determineAction = (method) => {
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'GET':
      return 'READ';
    case 'PUT':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'UNKNOWN';
  }
};

// Ambil data sebelumnya jika DELETE / UPDATE
const getPreviousData = async (req) => {
  const url = req.originalUrl;

  if (url.includes('/paydebt')) {
    const { transaction_id } = req.body;
    if (!transaction_id) return null;

    const query = `
      SELECT * FROM payment_logs 
      WHERE transaction_id = ? 
      ORDER BY payment_date DESC LIMIT 1
    `;
    const [results] = await dbConnection
      .promise()
      .execute(query, [transaction_id]);
    return results.length ? results[0] : null;
  }

  if (url.includes('/customers')) {
    console.log('masuk ke block if customers');

    const { id } = req.params;
    if (!id) return null;

    const query = `SELECT * FROM customers WHERE id = ?`;
    const [results] = await dbConnection.promise().execute(query, [id]);
    return results.length ? results[0] : null;
  }

  // Default fallback: transactions
  const { id } = req.params;
  if (!id) return null;

  const query = `SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL`;
  const [results] = await dbConnection.promise().execute(query, [id]);
  return results.length ? results[0] : null;
};

export default logHelper;
