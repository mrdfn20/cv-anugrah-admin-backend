import customerSchema from '../validators/customersValidators.js';
import CustomersService from '../services/customersService.js';

/**
 * Mengambil semua pelanggan dari database.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getAllCustomers = (req, res) => {
  CustomersService.getAllCustomers((err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'No customers found' });
    }
    res.status(200).json(results);
  });
};

/**
 * Mengambil satu pelanggan berdasarkan ID.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getCustomerById = (req, res) => {
  const id = req.params.id;
  CustomersService.getCustomerByIdWithCallback(id, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.json(results); // ✅ Mengembalikan objek pelanggan (bukan array)
  });
};

/**
 * Menambahkan pelanggan baru ke database.
 * @param {Object} req - Request dari client (berisi data pelanggan).
 * @param {Object} res - Response dari server.
 */
export const addCustomer = (req, res) => {
  const { error } = customerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  CustomersService.addCustomer(req, req.body, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      message: 'Customer added successfully!',
      customerId: results.insertId,
    });
  });
};

/**
 * Memperbarui data pelanggan berdasarkan ID.
 * @param {Object} req - Request dari client (berisi data yang akan diperbarui).
 * @param {Object} res - Response dari server.
 */
export const updateCustomerById = (req, res) => {
  const { error } = customerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const id = req.params.id;
  const { title, customer_name, date_of_birth, address, whatsapp_number } =
    req.body;

  CustomersService.updateCustomerById(req, id, req.body, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json({
      message: 'Customer updated successfully!',
      updatedCustomer: {
        id,
        title,
        customer_name,
        date_of_birth,
        address,
        whatsapp_number,
      },
    });
  });
};

/**
 * Memperbarui sebagian data pelanggan berdasarkan ID (PATCH).
 * @param {Object} req - Request dari client (berisi data yang akan diperbarui sebagian).
 * @param {Object} res - Response dari server.
 */
// export const patchCustomerById = (req, res) => {
//   const id = req.params.id;
//   const updateFields = req.body;

//   if (!updateFields || Object.keys(updateFields).length === 0) {
//     return res.status(400).json({ message: 'No fields to update' });
//   }

//   Customer.patchCustomerById(id, updateFields, (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: err.message });
//     }
//     if (results.affectedRows === 0) {
//       return res.status(404).json({ message: 'Customer not found' });
//     }
//     res.status(200).json({
//       message: 'Customer partially updated successfully!',
//       updatedFields: updateFields,
//     });
//   });
// };

/**
 * Menghapus pelanggan berdasarkan ID.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const deleteCustomerById = (req, res) => {
  const id = req.params.id;
  CustomersService.deleteCustomerById(id, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message, id: id });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({
      message: 'Customer deleted successfully!',
      numCustomersDeleted: results.affectedRows,
    });
  });
};
