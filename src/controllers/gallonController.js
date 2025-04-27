import GallonService from '../services/gallonService.js';

import moment from 'moment-timezone';

export const getGallonPriceByCustomerId = async (req, res) => {
  const customer_id = req.params.customer_id;

  try {
    const results = await GallonService.getGallonPriceByCustomerId(customer_id);

    if (!results) {
      return res
        .status(404)
        .json({ message: 'Customer or gallon price not found' });
    }

    console.log(customer_id);
    

    res.status(200).json({
      customer_id,
      gallon_price: results.price,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getCustomersGallonsStockRecap = async (req, res) => {
  try {
    const results = await GallonService.getCustomersGallonsStockRecap();
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getCustomerGallonsStockRecapByCustomerId = async (req, res) => {
  const { customer_id } = req.params;

  try {
    const result = await GallonService.getCustomerGallonsStockRecapByCustomerId(
      customer_id
    );

    if (!result) {
      return res
        .status(404)
        .json({ message: 'Customer not found or no transaction data' });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getCustomersGallonsStockRecapByFilter = async (req, res) => {
  try {
    let {
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
      sortOrder,
    } = req.query;

    // ✅ Validasi minimal 1 filter
    const hasAnyFilter = [
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
      sortOrder,
    ].some((val) => val !== undefined);

    if (!hasAnyFilter) {
      return res
        .status(400)
        .json({ error: 'Please provide at least one filter' });
    }

    // ✅ Validasi numerik
    if (customer_id && isNaN(parseInt(customer_id))) {
      return res.status(400).json({ error: 'Invalid customer_id parameter' });
    }

    if (transaction_id && isNaN(parseInt(transaction_id))) {
      return res
        .status(400)
        .json({ error: 'Invalid transaction_id parameter' });
    }

    if (sub_region_id && isNaN(parseInt(sub_region_id))) {
      return res.status(400).json({ error: 'Invalid sub_region_id parameter' });
    }

    if (
      transaction_type &&
      transaction_type !== 'Tunai' &&
      transaction_type !== 'Hutang'
    ) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (armada_id && isNaN(parseInt(armada_id))) {
      return res.status(400).json({ error: 'Invalid armada_id parameter' });
    }

    // ✅ Format & normalisasi nama
    if (customer_name && typeof customer_name === 'string') {
      customer_name = decodeURI(customer_name.toUpperCase());
    }

    // ✅ Validasi tanggal
    if (
      (startDate && !moment(startDate, 'YYYY-MM-DD', true).isValid()) ||
      (endDate && !moment(endDate, 'YYYY-MM-DD', true).isValid())
    ) {
      return res
        .status(400)
        .json({ error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD' });
    }

    if (stockLimit && isNaN(parseInt(stockLimit))) {
      return res.status(400).json({ error: 'Invalid stockLimit parameter' });
    }

    // ✅ Validasi sortBy dan sortOrder
    const allowedSortColumns = [
      'customer_id',
      'customer_name',
      'sub_region_name',
      'unreturned_gallons',
    ];
    if (sortBy && !allowedSortColumns.includes(sortBy)) {
      return res.status(400).json({ error: 'Invalid sortBy parameter' });
    }

    const allowedSortOrder = ['ASC', 'DESC'];
    if (sortOrder && !allowedSortOrder.includes(sortOrder.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid sortOrder parameter' });
    }

    // ✅ Ambil hasil
    const results = await GallonService.getCustomersGallonsStockRecapByFilter(
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
      sortOrder?.toUpperCase()
    );

    if (!results.length) {
      return res.status(404).json({ message: 'No data found' });
    }

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
