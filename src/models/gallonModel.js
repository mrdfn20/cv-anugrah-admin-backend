import dbConnection from '../config/db.js';

const Gallon = {
  async getGallonPriceByCustomerId(customer_id) {
    const query = `
      SELECT gp.id, gp.price 
      FROM gallon_prices gp 
      LEFT JOIN customers c ON c.gallon_price_id = gp.id 
      WHERE c.id = ?
    `;

    const [results] = await dbConnection
      .promise()
      .execute(query, [customer_id]);

    return results[0] || null; // ✅ Juga fix untuk async
  },

  async getCustomersGallonsStockRecap() {
    const query = `SELECT
    c.id AS customer_id,
    c.customer_name,
    IFNULL(SUM(t.gallon_filled), 0) - IFNULL(SUM(t.gallon_empty + t.gallon_returned), 0) AS unreturned_gallons
    FROM customers c
    LEFT JOIN transactions t ON c.id = t.customer_id AND t.deleted_at IS NULL
    GROUP BY c.id, c.customer_name`;

    const [results] = await dbConnection.promise().execute(query);
    return results;
  },

  async getCustomerGallonsStockRecapByCustomerId(customer_id) {
    const query = `SELECT
    c.id AS customer_id,
    c.customer_name,
    IFNULL(SUM(t.gallon_filled), 0) - IFNULL(SUM(t.gallon_empty + t.gallon_returned), 0) AS unreturned_gallons
    FROM customers c
    LEFT JOIN transactions t ON c.id = t.customer_id AND t.deleted_at IS NULL
    WHERE c.id = ?
    GROUP BY c.id, c.customer_name;`;

    const [results] = await dbConnection
      .promise()
      .execute(query, [customer_id]);
    return results[0];
  },

  async getCustomersGallonsStockRecapByFilter(
    customer_id,
    customer_name,
    transaction_id,
    sub_region_id,
    sub_region_name,
    transaction_type,
    armada_id,
    startDate,
    endDate,
    stockLimit,
    sortBy,
    sortOrder
  ) {
    let query = `
      SELECT
        c.id AS customer_id,
        c.customer_name,
        sr.sub_region_name,
      IFNULL(SUM(t.gallon_filled), 0) - IFNULL(SUM(t.gallon_empty + t.gallon_returned), 0) AS unreturned_gallons
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id AND t.deleted_at IS NULL
      LEFT JOIN sub_regions sr ON c.sub_region_id = sr.id
      WHERE 1=1`;

    let queryParams = [];

    if (customer_id) {
      query += ` AND c.id = ?`;
      queryParams.push(customer_id);
    }

    if (customer_name) {
      query += ` AND c.customer_name LIKE ?`;
      queryParams.push(`%${customer_name}%`);
    }

    if (transaction_id) {
      query += ` AND t.id = ?`;
      queryParams.push(transaction_id);
    }

    if (sub_region_id) {
      query += ` AND c.sub_region_id = ?`;
      queryParams.push(sub_region_id);
    }

    if (sub_region_name) {
      query += ` AND sr.sub_region_name LIKE ?`;
      queryParams.push(`%${sub_region_name}%`);
    }

    if (transaction_type) {
      query += ` AND t.transaction_type = ?`;
      queryParams.push(transaction_type);
    }

    if (armada_id) {
      query += ` AND t.armada_id = ?`;
      queryParams.push(armada_id);
    }

    if (startDate && endDate) {
      query += ` AND DATE(t.transaction_date) BETWEEN ? AND ?`;
      queryParams.push(startDate, endDate);
    }

    query += ` GROUP BY c.id, c.customer_name, sr.sub_region_name`;

    if (stockLimit !== undefined && stockLimit !== null) {
      query += ` HAVING unreturned_gallons <= ?`;
      queryParams.push(stockLimit);
    }

    if (sortBy === 'customer_id') {
      query += ` ORDER BY c.id`;
    } else if (sortBy === 'customer_name') {
      query += ` ORDER BY c.customer_name`;
    } else if (sortBy === 'unreturned_gallons') {
      query += ` ORDER BY unreturned_gallons`;
    } else if (sortBy === 'sub_region_name') {
      query += ` ORDER BY sr.sub_region_name`;
    } else {
      query += ` ORDER BY c.customer_name`; // Default sorting
    }

    if (sortOrder === 'ASC' || sortOrder === 'DESC') {
      query += ` ${sortOrder}`;
    } else {
      query += ` ASC`; // Default order
    }

    console.log(query);
    console.log(queryParams);

    const [results] = await dbConnection.promise().execute(query, queryParams);
    return results;
  },
};

export default Gallon;
