import CustomerBalanceService from '../services/customerBalanceService.js';
import CustomersService from '../services/customersService.js';

/**
 * Menambahkan saldo pelanggan baru ke database.
 * @param {Object} req - Request dari client.
 * @param {Object} res - Response dari server.
 */
export const addCustomerBalance = async (req, res) => {
  try {
    const { customer_id, balance } = req.body;

    if (!customer_id || isNaN(customer_id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const customer = await CustomersService.getCustomerById(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const existingBalance = await CustomerBalanceService.getCustomerBalanceById(
      customer_id
    );
    if (existingBalance) {
      return res
        .status(409)
        .json({ error: 'Balance already exists for this customer' });
    }

    await CustomerBalanceService.addCustomerBalance(req, {
      customer_id,
      balance,
    });

    return res.status(201).json({
      message: 'Customer balance added successfully!',
      customer_id,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
      return res.status(404).json({ message: 'No customer balances found' });
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    return res.status(400).json({ error: 'Invalid customer ID' });
  }

  try {
    const result = await CustomerBalanceService.getCustomerBalanceById(id);

    if (!result) {
      return res.status(404).json({ message: 'Customer balance not found' });
    }

    res.status(200).json({ customer_id: id, balance: result.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  if (!customer_id || isNaN(customer_id)) {
    return res.status(400).json({ error: 'Invalid customer ID' });
  }

  if (!balance || isNaN(balance)) {
    return res.status(400).json({ error: 'Invalid balance' });
  }

  // ✅ Cek apakah customer_id ada
  const customer = await CustomersService.getCustomerById(customer_id);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  if (balance <= 0) {
    return res.status(400).json({ error: 'Balance cannot be 0 or negative' });
  }

  try {
    // ✅ Panggil service
    const result = await CustomerBalanceService.updateCustomerBalance(req, {
      customer_id,
      balance,
    });

    res.status(200).json({
      message: 'Customer balance updated successfully!',
      customer_id,
      addedBalance: balance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
