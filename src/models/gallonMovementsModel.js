// models/gallonMovementsModel.js
import dbConnection from '../config/db.js';

class GallonMovementsModel {
  async getAllMovements() {
    const query = `
      SELECT 
        customer_id,
        id AS transaction_id,
        transaction_date,
        gallon_filled,
        gallon_empty,
        gallon_returned
      FROM transactions
      WHERE deleted_at IS NULL
      ORDER BY customer_id, transaction_date ASC
    `;

    const [results] = await dbConnection.promise().execute(query);
    return results;
  }

  async getMovementsByCustomerId(customer_id) {
    const query = `
      SELECT 
        id AS transaction_id,
        transaction_date,
        gallon_filled,
        gallon_empty,
        gallon_returned
      FROM transactions
      WHERE customer_id = ? AND deleted_at IS NULL
      ORDER BY transaction_date ASC
    `;

    const [results] = await dbConnection
      .promise()
      .execute(query, [customer_id]);
    return results;
  }
}

export default new GallonMovementsModel();
