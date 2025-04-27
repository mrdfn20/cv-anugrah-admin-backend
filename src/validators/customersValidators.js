import Joi from 'joi';

const customerSchema = Joi.object({
  title: Joi.string().max(10).required(),
  customer_name: Joi.string().max(255).required(),
  date_of_birth: Joi.date().allow(null),
  address: Joi.string().max(500).required(),
  whatsapp_number: Joi.string().allow(null),
  customer_gallon_stock: Joi.number().integer().min(0).default(0),
  gallon_price_id: Joi.string().required(),
  subscription_date: Joi.date().default(new Date()),
  customer_photo: Joi.string().allow(null),
  sub_region_id: Joi.number().integer().allow(null),
  customer_type_id: Joi.number().integer().required(),
  latitude: Joi.number().precision(6).allow(null),
  longitude: Joi.number().precision(6).allow(null),
});

export default customerSchema;
