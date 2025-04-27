import Joi from 'joi';

const paymentLogsSchema = Joi.object({
  transaction_id: Joi.number().integer().required(),
  customer_id: Joi.number().integer().required(),
  payment_date: Joi.date().allow(null).optional(),
  amount_paid: Joi.number().precision(2).min(0).required(), // Mendukung desimal
  payment_type: Joi.string()
    .valid('Tunai', 'Transfer', 'Deposit')
    .allow(null)
    .optional(),
});

export default paymentLogsSchema;
