import dbConnection from '../config/db.js';

const Customer = {
  /**
   * Mengambil semua data pelanggan dari tabel `customers`
   * @param {Function} callback - Callback function untuk menangani hasil query
   */
  getAllCustomers: (callback) => {
    const query = 'SELECT * FROM customers';
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
    const query = `SELECT * FROM customers WHERE id = ?`;
    const [results] = await dbConnection.promise().execute(query, [id]);
    return results[0];
  },

  getCustomerByIdWithCallback: (id, callback) => {
    const query = `SELECT * FROM customers WHERE id = ?`;
    dbConnection.query(query, [id], (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(null, null); // Jika tidak ada hasil
      return callback(null, results[0]); // Kembalikan objek pelanggan
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
   * Menghapus pelanggan berdasarkan ID
   * @param {Number} id - ID pelanggan yang akan dihapus
   * @param {Function} callback - Callback function untuk menangani hasil query
   */
  deleteCustomerById: (id, callback) => {
    const query = 'DELETE FROM customers WHERE id = ?';
    dbConnection.query(query, [id], (err, results) => {
      if (err) return callback(err, null);
      return callback(null, {
        message: 'Customer deleted successfully',
        affectedRows: results.affectedRows,
      });
    });
  },
};

export default Customer;
