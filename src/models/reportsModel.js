import dbConnection from '../config/db.js';

const ReportsModel = {
  /**
   * Ringkasan transaksi dalam satu rentang tanggal (inklusif), opsional
   * dipersempit ke 1 pelanggan (customerId) - dipakai jg buat "laporan per
   * pelanggan" (statement) di FE, endpoint yg sama tinggal ditambah customer_id.
   * Definisi "pendapatan" ikut konvensi dashboardModel.getIncomeSummary():
   * SUM(payment_amount) berdasar transaction_date, bukan payment_logs.payment_date -
   * supaya konsisten dengan angka yang sudah ditampilkan di Dashboard.
   */
  async getSummaryByPeriod(startDate, endDate, customerId) {
    const customerFilter = customerId ? 'AND customer_id = ?' : '';
    const summaryParams = customerId
      ? [startDate, endDate, customerId]
      : [startDate, endDate];

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
      ${customerFilter}
    `;
    const [summaryRows] = await dbConnection.promise().execute(summaryQuery, summaryParams);

    // Sisa hutang dari transaksi Hutang yang DIBUAT dalam periode ini
    // (bisa saja baru lunas setelah periode berakhir - ini snapshot saat ini).
    const debtCustomerFilter = customerId ? 'AND t.customer_id = ?' : '';
    const debtParams = customerId
      ? [startDate, endDate, customerId]
      : [startDate, endDate];

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
        ${debtCustomerFilter}
        GROUP BY t.id
      ) AS sub
    `;
    const [debtRows] = await dbConnection.promise().execute(remainingDebtQuery, debtParams);

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

  /**
   * Ringkasan omzet & hutang per wilayah (kecamatan) dalam satu rentang tanggal.
   * Pelanggan yang belum punya sub_region_id (belum dikategorikan) dikelompokkan
   * sbg "Belum Ada Wilayah" - supaya total tetap utuh, gak diam2 ke-drop dari laporan.
   * LEFT JOIN dipakai di semua level (customer->sub_region->region) justru karena itu.
   */
  async getSummaryByRegion(startDate, endDate) {
    const salesQuery = `
      SELECT
        COALESCE(r.id, 0) AS region_id,
        COALESCE(r.region_name, 'Belum Ada Wilayah') AS region_name,
        COUNT(t.id) AS total_transactions,
        IFNULL(SUM(t.payment_amount), 0) AS total_income,
        IFNULL(SUM(t.total_price), 0) AS total_sales
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      LEFT JOIN sub_regions sr ON c.sub_region_id = sr.id
      LEFT JOIN regions r ON sr.region_id = r.id
      WHERE DATE(t.transaction_date) BETWEEN ? AND ?
      AND t.deleted_at IS NULL
      GROUP BY COALESCE(r.id, 0), COALESCE(r.region_name, 'Belum Ada Wilayah')
    `;
    const [salesRows] = await dbConnection
      .promise()
      .execute(salesQuery, [startDate, endDate]);

    const debtQuery = `
      SELECT region_id, region_name, SUM(remaining) AS remaining_debt FROM (
        SELECT
          COALESCE(r.id, 0) AS region_id,
          COALESCE(r.region_name, 'Belum Ada Wilayah') AS region_name,
          t.id,
          t.total_price - IFNULL(SUM(pl.amount_paid), 0) AS remaining
        FROM transactions t
        JOIN customers c ON t.customer_id = c.id
        LEFT JOIN sub_regions sr ON c.sub_region_id = sr.id
        LEFT JOIN regions r ON sr.region_id = r.id
        LEFT JOIN payment_logs pl
          ON t.id = pl.transaction_id AND pl.deleted_at IS NULL
        WHERE t.transaction_type = 'Hutang'
        AND t.deleted_at IS NULL
        AND DATE(t.transaction_date) BETWEEN ? AND ?
        GROUP BY t.id, COALESCE(r.id, 0), COALESCE(r.region_name, 'Belum Ada Wilayah')
      ) AS sub
      GROUP BY region_id, region_name
    `;
    const [debtRows] = await dbConnection
      .promise()
      .execute(debtQuery, [startDate, endDate]);

    const debtByRegion = new Map(
      debtRows.map((r) => [r.region_id, Number(r.remaining_debt) || 0])
    );

    return salesRows
      .map((r) => ({
        region_id: r.region_id,
        region_name: r.region_name,
        total_transactions: Number(r.total_transactions) || 0,
        total_income: Number(r.total_income) || 0,
        total_sales: Number(r.total_sales) || 0,
        remaining_debt: debtByRegion.get(r.region_id) || 0,
      }))
      .sort((a, b) => b.total_sales - a.total_sales);
  },
};

export default ReportsModel;
