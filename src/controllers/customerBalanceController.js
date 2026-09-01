import CustomerBalanceService from '../services/customerBalanceService.js';
import CustomersService from '../services/customersService.js';
import {
  successResponse,
  validationErrorResponse,
  notFoundErrorResponse,
  conflictErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

/**
 * Menambahkan saldo pelanggan baru ke database.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const addCustomerBalance = async (req, res) => {
  try {
    const { customer_id, balance } = req.body;

    if (!customer_id || isNaN(customer_id)) {
      return validationErrorResponse(res, ['Invalid customer ID']);
    }

    const customer = await CustomersService.getCustomerById(customer_id);
    if (!customer) {
      return notFoundErrorResponse(res, 'Customer');
    }

    const existingBalance = await CustomerBalanceService.getCustomerBalanceById(
      customer_id
    );
    if (existingBalance) {
      return conflictErrorResponse(
        res,
        'Balance already exists for this customer'
      );
    }

    await CustomerBalanceService.addCustomerBalance(req, {
      customer_id,
      balance,
    });

    return successResponse(
      res,
      'Customer balance added successfully',
      { customer_id },
      null,
      201
    );
  } catch (error) {
    console.error('[ADD CUSTOMER BALANCE ERROR]', error);
    return internalErrorResponse(res, 'Gagal menambahkan saldo pelanggan', error);
  }
};

/**
 * Mengambil semua saldo pelanggan dari database.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getCustomersBalance = async (req, res) => {
  try {
    const results = await CustomerBalanceService.getCustomersBalance();

    if (!results || results.length === 0) {
      return successResponse(res, 'No customer balances found', [], null, 200);
    }

    return successResponse(
      res,
      'Customer balances retrieved successfully',
      results,
      null,
      200
    );
  } catch (error) {
    console.error('[GET CUSTOMERS BALANCE ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data saldo pelanggan', error);
  }
};

/**
 * Mengambil saldo pelanggan berdasarkan ID pelanggan.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const getCustomerBalanceById = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return validationErrorResponse(res, ['Invalid customer ID']);
  }

  try {
    const result = await CustomerBalanceService.getCustomerBalanceById(id);

    if (!result) {
      return notFoundErrorResponse(res, 'Customer balance');
    }

    return successResponse(
      res,
      'Customer balance retrieved successfully',
      { customer_id: id, balance: result.balance },
      null,
      200
    );
  } catch (error) {
    console.error('[GET CUSTOMER BALANCE BY ID ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data saldo pelanggan', error);
  }
};

/**
 * Memperbarui saldo pelanggan berdasarkan ID pelanggan.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const updateCustomerBalance = async (req, res) => {
  const { customer_id, balance } = req.body;

  // ✅ Validasi input
  const validationErrors = [];
  if (!customer_id || isNaN(customer_id)) {
    validationErrors.push('Invalid customer ID');
  }
  if (!balance || isNaN(balance)) {
    validationErrors.push('Invalid balance');
  } else if (balance <= 0) {
    validationErrors.push('Balance cannot be 0 or negative');
  }
  if (validationErrors.length > 0) {
    return validationErrorResponse(res, validationErrors);
  }

  try {
    // ✅ Cek apakah customer_id ada
    const customer = await CustomersService.getCustomerById(customer_id);
    if (!customer) {
      return notFoundErrorResponse(res, 'Customer');
    }

    // ✅ Panggil service
    await CustomerBalanceService.updateCustomerBalance(req, {
      customer_id,
      balance,
    });

    return successResponse(
      res,
      'Customer balance updated successfully',
      { customer_id, addedBalance: balance },
      null,
      200
    );
  } catch (error) {
    console.error('[UPDATE CUSTOMER BALANCE ERROR]', error);
    return internalErrorResponse(res, 'Gagal memperbarui saldo pelanggan', error);
  }
};
