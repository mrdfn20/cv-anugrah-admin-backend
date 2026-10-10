import dbConnection from '../config/db.js';

const Customer = {
  /**
   * Mengambil semua data pelanggan dari tabel `customers`
   * @param {Function} callback - Callback function untuk menangani hasil query
   */
  getAllCustomers: (callback) => {
    // 🐛 Bug ditemuin user (2026-10-10): total_debt dulu dihitung dari `t.payment_amount`
    // (kolom beku, diisi SEKALI pas transaksi dibuat, gak pernah di-update lagi) - padahal
    // SEMUA pembayaran hutang (tombol "Bayar Hutang" normal, ATAUPUN koreksi data historis)
    // dicatat di tabel `payment_logs`, bukan nulis ulang kolom itu. Hasilnya: pelanggan yang
    // hutangnya udah lunas lewat payment_logs tetep keitung penuh di sini, padahal halaman
    // detail pelanggan (yang emang udah bener, ngitung live dari payment_logs) nunjukin udah
    // lunas. Disamain ke pola yang sama kayak transactionsModel.js/paymentLogsModel.js:
    // remaining_debt per transaksi dihitung live, di-clamp ke 0 (transaksi yang overpay gak
    // boleh "ngurangin" hutang transaksi lain), baru dijumlah.
    const query = `SELECT cst.*,
                    gp.price,
                    sr.sub_region_name,
                    r.region_name,
                    COALESCE(cb.balance, 0) AS balance,
                    COALESCE(debt.total_debt, 0) AS total_debt
                    FROM customers cst
                    LEFT JOIN gallon_prices gp ON cst.gallon_price_id = gp.id
                    LEFT JOIN sub_regions sr ON cst.sub_region_id = sr.id
                    LEFT JOIN regions r ON sr.region_id = r.id
                    LEFT JOIN customer_balances cb ON cb.customer_id = cst.id
                    LEFT JOIN (
                      SELECT t.customer_id,
                             SUM(GREATEST(t.total_price - COALESCE(pl.paid, 0), 0)) AS total_debt
                      FROM transactions t
                      LEFT JOIN (
                        SELECT transaction_id, SUM(amount_paid) AS paid
                        FROM payment_logs
                        WHERE deleted_at IS NULL
                        GROUP BY transaction_id
                      ) pl ON pl.transaction_id = t.id
                      WHERE t.transaction_type = 'Hutang' AND t.deleted_at IS NULL
                      GROUP BY t.customer_id
                    ) debt ON debt.customer_id = cst.id
                    WHERE cst.deleted_at IS NULL`;
    dbConnection.query(query, (err, results) => {
      if (err) return callback(err, null);
      return callback(null, results);
    });
  },

  /**
   * Mengambil data pelanggan berdasarkan ID
   * @param {Number} id - ID pelanggan
   * @param {Function} callback - Callback function untuk menangani hasil query
   */

  getCustomerById: async (id) => {
    // Sama kayak catatan di getAllCustomers() di atas - total_debt dihitung live dari
    // payment_logs (bukan kolom t.payment_amount yang beku), di-clamp 0 per transaksi.
    const query = `SELECT cst.*,
                    gp.price,
                    sr.sub_region_name,
                    r.region_name,
                    COALESCE(cb.balance, 0) AS balance,
                    COALESCE((
                      SELECT SUM(GREATEST(t.total_price - COALESCE((
                        SELECT SUM(pl.amount_paid) FROM payment_logs pl
                        WHERE pl.transaction_id = t.id AND pl.deleted_at IS NULL
                      ), 0), 0))
                      FROM transactions t
                      WHERE t.customer_id = cst.id
                        AND t.transaction_type = 'Hutang'
                        AND t.deleted_at IS NULL
                    ), 0) AS total_debt
                    FROM customers cst
                    LEFT JOIN gallon_prices gp ON cst.gallon_price_id = gp.id
                    LEFT JOIN sub_regions sr ON cst.sub_region_id = sr.id
                    LEFT JOIN regions r ON sr.region_id = r.id
                    LEFT JOIN customer_balances cb ON cb.customer_id = cst.id
                    WHERE cst.id = ? AND cst.deleted_at IS NULL`;
    const [results] = await dbConnection.promise().execute(query, [id]);
    return results[0];
  },

  getCustomerByIdWithCallback: (id, callback) => {
    const query = `SELECT cst.*,
                    gp.price,
                    sr.sub_region_name,
                    r.region_name,
                    COALESCE(cb.balance, 0) AS balance
                    FROM customers cst
                    LEFT JOIN gallon_prices gp ON cst.gallon_price_id = gp.id
                    LEFT JOIN sub_regions sr ON cst.sub_region_id = sr.id
                    LEFT JOIN regions r ON sr.region_id = r.id
                    LEFT JOIN customer_balances cb ON cb.customer_id = cst.id
                    WHERE cst.id = ? AND cst.deleted_at IS NULL`;
    dbConnection.query(query, [id], (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(null, null); // Jika tidak ada hasil
      return callback(null, results); // Kembalikan objek pelanggan
    });
  },

  /**
   * Menambahkan pelanggan baru ke dalam database
   * @param {Object} customerData - Data pelanggan yang akan ditambahkan
   * @param {Function} callback - Callback function untuk menangani hasil query
   */
  addCustomer: (customerData, callback) => {
    const {
      title,
      customer_name,
      date_of_birth,
      address,
      whatsapp_number,
      customer_gallon_stock,
      gallon_price_id,
      subscription_date,
      customer_photo,
      sub_region_id,
      customer_type_id,
      latitude,
      longitude,
    } = customerData;

    const queryInsert = `
      INSERT INTO customers 
      (title, customer_name, date_of_birth, address, whatsapp_number, 
      customer_gallon_stock, gallon_price_id, subscription_date, 
      customer_photo, sub_region_id, customer_type_id, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    dbConnection.query(
      queryInsert,
      [
        title,
        customer_name,
        date_of_birth || null,
        address,
        whatsapp_number || null,
        customer_gallon_stock || 0,
        gallon_price_id,
        subscription_date || new Date().toISOString().slice(0, 10),
        customer_photo || null,
        sub_region_id || null,
        customer_type_id,
        latitude || null,
        longitude || null,
      ],
      (err, results) => {
        if (err) return callback(err, null);
        return callback(null, { id: results.insertId, ...customerData });
      }
    );
  },

  /**
   * Memperbarui data pelanggan berdasarkan ID
   * @param {Number} id - ID pelanggan yang akan diperbarui
   * @param {Object} customerData - Data pelanggan yang akan diperbarui
   * @param {Function} callback - Callback function untuk menangani hasil query
   */
  updateCustomerById: (customer_id, customerData, callback) => {
    const {
      title,
      customer_name,
      date_of_birth,
      address,
      whatsapp_number,
      customer_gallon_stock,
      gallon_price_id,
      subscription_date,
      customer_photo,
      sub_region_id,
      customer_type_id,
      latitude,
      longitude,
    } = customerData;

    const queryUpdate = `
      UPDATE customers 
      SET title=?, customer_name=?, date_of_birth=?, address=?, whatsapp_number=?, 
          customer_gallon_stock=?, gallon_price_id=?, subscription_date=?, 
          customer_photo=?, sub_region_id=?, customer_type_id=?, latitude=?, longitude=? 
      WHERE id=?
    `;

    dbConnection.query(
      queryUpdate,
      [
        title,
        customer_name,
        date_of_birth,
        address,
        whatsapp_number,
        customer_gallon_stock,
        gallon_price_id,
        subscription_date,
        customer_photo,
        sub_region_id,
        customer_type_id,
        latitude,
        longitude,
        customer_id, // ID harus di akhir query sesuai dengan WHERE
      ],
      (err, results) => {
        if (err) return callback(err, null);
        return callback(null, {
          message: 'Customer updated successfully',
          affectedRows: results.affectedRows,
        });
      }
    );
  },

  /**
   * Menghapus pelanggan berdasarkan ID (soft delete - ditandai deleted_at,
   * bukan beneran dihapus dari DB, supaya bisa di-restore kalau salah hapus).
   * @param {Number} id - ID pelanggan yang akan dihapus
   * @param {Function} callback - Callback function untuk menangani hasil query
   */
  deleteCustomerById: (id, callback) => {
    const query =
      'UPDATE customers SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL';
    dbConnection.query(query, [id], (err, results) => {
      if (err) return callback(err, null);
      return callback(null, {
        message: 'Customer deleted successfully',
        affectedRows: results.affectedRows,
      });
    });
  },

  /**
   * Mengembalikan pelanggan yang sebelumnya dihapus (soft delete).
   * @param {Number} id - ID pelanggan yang akan di-restore
   * @param {Function} callback - Callback function untuk menangani hasil query
   */
  restoreCustomerById: (id, callback) => {
    const query =
      'UPDATE customers SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL';
    dbConnection.query(query, [id], (err, results) => {
      if (err) return callback(err, null);
      return callback(null, {
        message: 'Customer restored successfully',
        affectedRows: results.affectedRows,
      });
    });
  },

  /**
   * Mengambil daftar pelanggan yang sudah dihapus (soft delete) - buat fitur restore.
   * @param {Function} callback - Callback function untuk menangani hasil query
   */
  getDeletedCustomers: (callback) => {
    const query = `SELECT id, title, customer_name, address, whatsapp_number, deleted_at
                    FROM customers
                    WHERE deleted_at IS NOT NULL
                    ORDER BY deleted_at DESC`;
    dbConnection.query(query, (err, results) => {
      if (err) return callback(err, null);
      return callback(null, results);
    });
  },

  /**
   * Daftar customer_id yang punya minimal 1 transaksi (non-deleted) di bulan
   * berjalan - dipakai buat kartu "Pelanggan Aktif/Tidak Aktif Bulan Ini".
   * Gak butuh tabel/relasi baru, murni query ke tabel transactions yg udah ada.
   */
  getActiveCustomerIdsThisMonth: async () => {
    const query = `
      SELECT DISTINCT customer_id
      FROM transactions
      WHERE deleted_at IS NULL
        AND transaction_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        AND transaction_date < DATE_FORMAT(CURDATE() + INTERVAL 1 MONTH, '%Y-%m-01')
    `;
    const [results] = await dbConnection.promise().execute(query);
    return results.map((r) => r.customer_id);
  },
};

export default Customer;
