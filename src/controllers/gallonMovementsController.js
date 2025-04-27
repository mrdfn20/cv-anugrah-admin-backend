import GallonMovementsService from '../services/gallonMovementsService.js';

/**
 * Mendapatkan histori pergerakan galon untuk seluruh pelanggan
 */
export const getAllGallonMovements = async (req, res) => {
  try {
    const { grouped } = req.query;
    const isGrouped = grouped === 'true'; // parse boolean

    const results = await GallonMovementsService.getAllMovements(isGrouped); // 🧠 pass opsi

    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mendapatkan histori pergerakan galon untuk satu pelanggan
 */
export const getGallonMovementsByCustomer = async (req, res) => {
  const { customer_id } = req.params;

  if (!customer_id || isNaN(parseInt(customer_id))) {
    return res.status(400).json({ error: 'Invalid customer ID' });
  }

  try {
    const results = await GallonMovementsService.getMovementsByCustomerId(customer_id);
    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ message: 'No gallon movements found for this customer' });
    }
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
