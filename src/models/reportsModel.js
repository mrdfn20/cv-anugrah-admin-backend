import dbConnection from '../config/db.js';

const ReportsModel = {
  /**
   * Ringkasan transaksi dalam satu rentang tanggal (inklusif).
   * Definisi "pendapatan" ikut konvensi dashboardModel.getIncomeSummary():
   * SUM(payment_amount) berdasar transaction_date, bukan payment_logs.payment_date -
   * supaya konsisten dengan angka yang sudah ditampilkan di Dashboard.
   */
  async getSummaryByPeriod(startDate, endDate) {
    const summaryQuery = `
      SELECT
        COUNT(*) AS total_transactions,
        SUM(CASE WHEN transaction_type = 'Tunai' THEN 1 ELSE 0 END) AS cash_count,
        SUM(CASE WHEN transaction_type = 'Hutang' THEN 1 ELSE 0 END) AS debt_count,
        IFNULL(SUM(payment_amount), 0) AS total_income,
        IFNULL(SUM(total_price), 0) AS total_sales,
        IFNULL(SUM(gallon_filled), 0) AS total_gallon_filled
      FROM transactions
      WHERE DATE(transaction_date) BETWEEN ? AND ?
      AND deleted_at IS NULL
    `;
    const [summaryRows] = await dbConnection
      .promise()
      .execute(summaryQuery, [startDate, endDate]);

    // Sisa hutang dari transaksi Hutang yang DIBUAT dalam periode ini
    // (bisa saja baru lunas setelah periode berakhir - ini snapshot saat ini).
    const remainingDebtQuery = `
      SELECT SUM(remaining) AS remaining_debt FROM (
        SELECT
          t.id,
          t.total_price - IFNULL(SUM(pl.amount_paid), 0) AS remaining
        FROM transactions t
        LEFT JOIN payment_logs pl
          ON t.id = pl.transaction_id AND pl.deleted_at IS NULL
        WHERE t.transaction_type = 'Hutang'
        AND t.deleted_at IS NULL
        AND DATE(t.transaction_date) BETWEEN ? AND ?
        GROUP BY t.id
      ) AS sub
    `;
    const [debtRows] = await dbConnection
      .promise()
      .execute(remainingDebtQuery, [startDate, endDate]);

    const summary = summaryRows[0];

    return {
      total_transactions: Number(summary.total_transactions) || 0,
      cash_count: Number(summary.cash_count) || 0,
      debt_count: Number(summary.debt_count) || 0,
      total_income: Number(summary.total_income) || 0,
      total_sales: Number(summary.total_sales) || 0,
      total_gallon_filled: Number(summary.total_gallon_filled) || 0,
      remaining_debt: Number(debtRows[0].remaining_debt) || 0,
    };
  },
};

export default ReportsModel;
