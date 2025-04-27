import dbConnection from '../config/db.js';
import moment from 'moment-timezone';

class SearchModel {
  static async searchCustomers(keyword) {
    const query = `
      SELECT * FROM customers 
      WHERE customer_name LIKE ? OR whatsapp_number LIKE ?
    `;
    const [results] = await dbConnection
      .promise()
      .execute(query, [`%${keyword}%`, `%${keyword}%`]);
    return results;
  }

  static async searchTransactions(keyword) {
    const query = `
      SELECT t.*, c.customer_name, c.sub_region_id FROM transactions t
    LEFT JOIN customers c ON t.customer_id = c.id 
    WHERE (t.id LIKE ? OR c.customer_name LIKE ?)
    AND t.deleted_at IS NULL
    `;
    const [results] = await dbConnection
      .promise()
      .execute(query, [`%${keyword}%`, `%${keyword}%`]);

    return results.map((t) => ({
      ...t,
      transaction_date: moment(t.transaction_date)
        .tz('Asia/Jakarta')
        .format('YYYY-MM-DD'),
    }));
  }

  static async searchDebts(keyword) {
    const query = `
      SELECT 
        t.id AS transaction_id,
        c.customer_name,
        t.total_price,
        COALESCE(SUM(pl.amount_paid), 0) AS total_paid,
        (t.total_price - COALESCE(SUM(pl.amount_paid), 0)) AS remaining_debt
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN payment_logs pl ON t.id = pl.transaction_id AND pl.deleted_at IS NULL
      WHERE t.transaction_type = 'Hutang' 
      AND t.deleted_at IS NULL 
      AND (
        t.id LIKE ? OR 
        c.customer_name LIKE ?
      )
      GROUP BY t.id
      HAVING remaining_debt > 0
    `;
    const [results] = await dbConnection
      .promise()
      .execute(query, [`%${keyword}%`, `%${keyword}%`]);
    return results;
  }
}

export default SearchModel;
