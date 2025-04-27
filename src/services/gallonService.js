import GallonModel from '../models/gallonModel.js';

const GallonService = {
  getGallonPriceByCustomerId: async (customer_id) => {
    return await GallonModel.getGallonPriceByCustomerId(customer_id);
  },

  getCustomersGallonsStockRecap: async () => {
    return await GallonModel.getCustomersGallonsStockRecap();
  },

  getCustomerGallonsStockRecapByCustomerId: async (customer_id) => {
    return await GallonModel.getCustomerGallonsStockRecapByCustomerId(
      customer_id
    );
  },

  getCustomersGallonsStockRecapByFilter: async (
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
    sortOrder
  ) => {
    return await GallonModel.getCustomersGallonsStockRecapByFilter(
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
      sortOrder
    );
  },
};

export default GallonService;
