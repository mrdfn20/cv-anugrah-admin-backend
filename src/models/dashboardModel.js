import dbConnection from '../config/db.js';

class DashboardModel {
  static async getTotalTransactions() {
    const query = `
      SELECT COUNT(*) AS total_transactions 
      FROM transactions 
      WHERE deleted_at IS NULL
    `;
    const [rows] = await dbConnection.promise().execute(query);
    return rows[0].total_transactions;
  }

  static async getTotalIncome() {
    const query = `
      SELECT SUM(payment_amount) AS total_income 
      FROM transactions 
      WHERE deleted_at IS NULL
    `;
    const [rows] = await dbConnection.promise().execute(query);
    return Number(rows[0].total_income) || 0;
  }

  static async getTotalCustomers() {
    const query = `
      SELECT COUNT(*) AS total_customers 
      FROM customers
    `;
    const [rows] = await dbConnection.promise().execute(query);
    return rows[0].total_customers;
  }

  static async getTotalDebt() {
    const query = `
       SELECT SUM(remaining) AS total_hutang FROM (
      SELECT 
        t.id,
        t.total_price - IFNULL(SUM(pl.amount_paid), 0) AS remaining
      FROM transactions t
      LEFT JOIN payment_logs pl 
        ON t.id = pl.transaction_id AND pl.deleted_at IS NULL
      WHERE t.transaction_type = 'Hutang' AND t.deleted_at IS NULL
      GROUP BY t.id
    ) AS sub
    `;
    const [rows] = await dbConnection.promise().execute(query);

    // Hitung total hutang dari semua baris (karena GROUP BY t.id)
    // const totalHutang = rows.reduce(
    //   (acc, row) => acc + (row.total_hutang || 0),
    //   0
    // );
    return Number(rows[0].total_hutang) || 0;
  }

  /**
   * Mendapatkan pemasukan harian, mingguan, dan bulanan
   */
  static async getIncomeSummary() {
    const query = `
          SELECT
            (SELECT IFNULL(SUM(payment_amount), 0) FROM transactions 
             WHERE DATE(transaction_date) = CURDATE() AND deleted_at IS NULL) AS income_today,
            (SELECT IFNULL(SUM(payment_amount), 0) FROM transactions 
             WHERE YEARWEEK(transaction_date, 1) = YEARWEEK(CURDATE(), 1) AND deleted_at IS NULL) AS income_week,
            (SELECT IFNULL(SUM(payment_amount), 0) FROM transactions 
             WHERE MONTH(transaction_date) = MONTH(CURDATE()) 
             AND YEAR(transaction_date) = YEAR(CURDATE()) 
             AND deleted_at IS NULL) AS income_month
        `;
    const [results] = await dbConnection.promise().query(query);
    return results[0];
  }

  static async getGallonSummary() {
    const query = `
      SELECT
        IFNULL(SUM(t.gallon_filled), 0) AS total_filled,
        IFNULL(SUM(t.gallon_empty), 0) AS total_empty,
        IFNULL(SUM(t.gallon_returned), 0) AS total_returned,
        (IFNULL(SUM(t.gallon_filled), 0) - IFNULL(SUM(t.gallon_empty + t.gallon_returned), 0)) AS unreturned_gallons
      FROM transactions t
      WHERE t.deleted_at IS NULL
    `;
    const [rows] = await dbConnection.promise().query(query);
    return rows[0];
  }

  static async getActiveCustomers() {
    const query = `
      SELECT COUNT(*) AS active_customers
      FROM customers
    `;
    const [rows] = await dbConnection.promise().query(query);
    return rows[0].active_customers;
  }

  static async getDebtStatus() {
    const query = `
      SELECT 
        t.id AS transaction_id,
        t.total_price,
        IFNULL(SUM(pl.amount_paid), 0) AS total_paid
      FROM transactions t
      LEFT JOIN payment_logs pl 
        ON t.id = pl.transaction_id AND pl.deleted_at IS NULL
      WHERE t.transaction_type = 'Hutang' AND t.deleted_at IS NULL
      GROUP BY t.id
    `;

    const [rows] = await dbConnection.promise().execute(query);

    let lunas = 0;
    let belumLunas = 0;

    rows.forEach((row) => {
      const remainingDebt = row.total_price - row.total_paid;
      if (remainingDebt === 0) {
        lunas++;
      } else if (remainingDebt > 0) {
        belumLunas++;
      }
    });

    return { lunas, belumLunas };
  }

  static async getTodayActivity() {
    const query = `
      SELECT
        COUNT(*) AS total_transactions,
        IFNULL(SUM(gallon_filled), 0) AS total_gallons_filled,
        IFNULL(SUM(payment_amount), 0) AS total_income
      FROM transactions
      WHERE DATE(transaction_date) = CURDATE() AND deleted_at IS NULL
    `;

    const [rows] = await dbConnection.promise().execute(query);
    return rows[0];
  }
}

export default DashboardModel;
