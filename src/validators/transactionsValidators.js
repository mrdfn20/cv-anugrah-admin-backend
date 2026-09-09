import Joi from 'joi';

const transactionSchema = Joi.object({
  customer_id: Joi.number().integer().required(),
  gallon_filled: Joi.number().integer().required(),
  gallon_empty: Joi.number().integer().optional(), // Bisa diisi atau tidak
  gallon_returned: Joi.number().integer().optional(), // Bisa diisi atau tidak
  transaction_type: Joi.string().valid('Tunai', 'Hutang').required(),
  armada_id: Joi.number().integer().valid(1, 2, 3).required(), // Armada harus ID numerik
  payment_amount: Joi.number().precision(2).min(0).required(),
  // 🆕 Opsional - biar Editor/Driver bisa backdate transaksi yang telat dicatat.
  // max('now') nolak tanggal MASA DEPAN (gak masuk akal buat transaksi yang udah
  // kejadian); gak ada batas bawah (backdate jauh ke belakang tetap diizinkan,
  // sama kayak payment_date di endpoint bayar hutang yang juga gak dibatasi).
  transaction_date: Joi.date().iso().max('now').optional().messages({
    'date.max': 'Tanggal transaksi tidak boleh di masa depan',
  }),
});

export default transactionSchema;
