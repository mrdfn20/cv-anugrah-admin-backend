// src/controllers/customersController.js
import customerSchema from '../validators/customersValidators.js';
import CustomersService from '../services/customersService.js';
import {
  successResponse,
  validationErrorResponse,
  notFoundErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

/**
 * Mengambil semua pelanggan dari database
 * @param {Object} req - Request dari client
 * @param {Object} res - Response dari server
 */
export const getAllCustomers = (req, res) => {
  CustomersService.getAllCustomers((err, results) => {
    if (err) {
      console.error('[GET ALL CUSTOMERS ERROR]', err);
      return internalErrorResponse(res, 'Gagal mengambil data customers', err);
    }

    if (!results || results.length === 0) {
      return successResponse(res, 'No customers found', [], null, 200);
    }

    return successResponse(
      res,
      'Customers retrieved successfully',
      results,
      null,
      200
    );
  });
};

/**
 * Mengambil satu pelanggan berdasarkan ID
 * @param {Object} req - Request dari client
 * @param {Object} res - Response dari server
 */
export const getCustomerById = (req, res) => {
  const id = req.params.id;

  // Validate ID parameter
  const customerId = parseInt(id);
  if (isNaN(customerId) || customerId < 1) {
    return validationErrorResponse(res, [
      'Customer ID harus berupa angka positif',
    ]);
  }

  CustomersService.getCustomerByIdWithCallback(id, (err, results) => {
    if (err) {
      console.error('[GET CUSTOMER BY ID ERROR]', err);
      return internalErrorResponse(res, 'Gagal mengambil data customer', err);
    }

    if (!results || results.length === 0) {
      return notFoundErrorResponse(res, 'Customer');
    }

    return successResponse(
      res,
      'Customer retrieved successfully',
      results[0], // Return single object, not array
      null,
      200
    );
  });
};

/**
 * Menambahkan pelanggan baru ke database
 * @param {Object} req - Request dari client (berisi data pelanggan)
 * @param {Object} res - Response dari server
 */
export const addCustomer = (req, res) => {
  // Validate request body with Joi
  const { error } = customerSchema.validate(req.body);
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    return validationErrorResponse(res, validationErrors);
  }

  CustomersService.addCustomer(req, req.body, (err, results) => {
    if (err) {
      console.error('[ADD CUSTOMER ERROR]', err);
      return internalErrorResponse(res, 'Gagal menambahkan customer', err);
    }

    // Return success response with created customer data
    const newCustomer = {
      id: results.insertId,
      ...req.body,
    };

    return successResponse(
      res,
      'Customer added successfully',
      newCustomer,
      null,
      201
    );
  });
};

/**
 * Memperbarui data pelanggan berdasarkan ID
 * @param {Object} req - Request dari client (berisi data yang akan diperbarui)
 * @param {Object} res - Response dari server
 */
export const updateCustomerById = (req, res) => {
  const id = req.params.id;

  // Validate ID parameter
  const customerId = parseInt(id);
  if (isNaN(customerId) || customerId < 1) {
    return validationErrorResponse(res, [
      'Customer ID harus berupa angka positif',
    ]);
  }

  // Validate request body with Joi
  const { error } = customerSchema.validate(req.body);
  if (error) {
    const validationErrors = error.details.map((detail) => detail.message);
    return validationErrorResponse(res, validationErrors);
  }

  CustomersService.updateCustomerById(req, id, req.body, (err, results) => {
    if (err) {
      console.error('[UPDATE CUSTOMER ERROR]', err);
      return internalErrorResponse(res, 'Gagal mengupdate customer', err);
    }

    if (results.affectedRows === 0) {
      return notFoundErrorResponse(res, 'Customer');
    }

    // Return success response with updated customer data
    const updatedCustomer = {
      id: customerId,
      ...req.body,
    };

    return successResponse(
      res,
      'Customer updated successfully',
      updatedCustomer,
      null,
      200
    );
  });
};

/**
 * Menghapus pelanggan berdasarkan ID
 * @param {Object} req - Request dari client
 * @param {Object} res - Response dari server
 */
export const deleteCustomerById = (req, res) => {
  const id = req.params.id;

  // Validate ID parameter
  const customerId = parseInt(id);
  if (isNaN(customerId) || customerId < 1) {
    return validationErrorResponse(res, [
      'Customer ID harus berupa angka positif',
    ]);
  }

  CustomersService.deleteCustomerById(req, id, (err, results) => {
    if (err) {
      console.error('[DELETE CUSTOMER ERROR]', err);
      return internalErrorResponse(res, 'Gagal menghapus customer', err);
    }

    if (results.affectedRows === 0) {
      return notFoundErrorResponse(res, 'Customer');
    }

    return successResponse(
      res,
      'Customer deleted successfully',
      {
        id: customerId,
        deletedCount: results.affectedRows,
      },
      null,
      200
    );
  });
};

/**
 * Mengembalikan pelanggan yang sebelumnya dihapus (soft delete)
 * @param {Object} req - Request dari client
 * @param {Object} res - Response dari server
 */
export const restoreCustomerById = (req, res) => {
  const id = req.params.id;

  const customerId = parseInt(id);
  if (isNaN(customerId) || customerId < 1) {
    return validationErrorResponse(res, [
      'Customer ID harus berupa angka positif',
    ]);
  }

  CustomersService.restoreCustomerById(req, id, (err, results) => {
    if (err) {
      console.error('[RESTORE CUSTOMER ERROR]', err);
      return internalErrorResponse(res, 'Gagal mengembalikan customer', err);
    }

    if (results.affectedRows === 0) {
      return notFoundErrorResponse(res, 'Customer yang sudah dihapus');
    }

    return successResponse(
      res,
      'Customer restored successfully',
      { id: customerId },
      null,
      200
    );
  });
};

/**
 * Mengambil daftar pelanggan yang sudah dihapus (soft delete)
 * @param {Object} req - Request dari client
 * @param {Object} res - Response dari server
 */
export const getDeletedCustomers = (req, res) => {
  CustomersService.getDeletedCustomers((err, results) => {
    if (err) {
      console.error('[GET DELETED CUSTOMERS ERROR]', err);
      return internalErrorResponse(
        res,
        'Gagal mengambil data customer terhapus',
        err
      );
    }

    return successResponse(
      res,
      'Deleted customers retrieved successfully',
      results || [],
      null,
      200
    );
  });
};

/**
 * Ringkasan pelanggan aktif/tidak aktif transaksi bulan ini - buat kartu
 * di halaman Manajemen Pelanggan. Gak butuh tabel baru, dihitung on-the-fly
 * dari tabel transactions yang udah ada.
 * @param {Object} req - Request dari client
 * @param {Object} res - Response dari server
 */
export const getActivitySummary = async (req, res) => {
  try {
    const activeCustomerIds = await CustomersService.getActivitySummary();
    return successResponse(
      res,
      'Customer activity summary retrieved successfully',
      { activeCustomerIds },
      null,
      200
    );
  } catch (error) {
    console.error('[GET CUSTOMER ACTIVITY SUMMARY ERROR]', error);
    return internalErrorResponse(
      res,
      'Gagal mengambil ringkasan aktivitas pelanggan',
      error
    );
  }
};
