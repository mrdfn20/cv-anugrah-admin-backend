import logHelper from '../helpers/logHelper.js';
import CustomersModel from '../models/customerModel.js';

const CustomersService = {
  addCustomer: (req, customerData, callback) => {
    logHelper(req, {
      action: 'CREATE',
      endpoint: '/customers',
      requestData: customerData,
    });
    return CustomersModel.addCustomer(customerData, callback);
  },

  updateCustomerById: (req, id, customerData, callback) => {
    logHelper(req, {
      action: 'UPDATE',
      endpoint: '/customers',
      requestData: customerData,
    });
    return CustomersModel.updateCustomerById(id, customerData, callback);
  },

  deleteCustomerById: (customer_id, callback) => {
    return CustomersModel.deleteCustomerById(customer_id, callback);
  },

  getAllCustomers: (callback) => {
    return CustomersModel.getAllCustomers(callback);
  },
  getCustomerById: (customer_id) => {
    return CustomersModel.getCustomerById(customer_id);
  },
  getCustomerByIdWithCallback: (customer_id, callback) => {
    return CustomersModel.getCustomerByIdWithCallback(customer_id, callback);
  },
};

export default CustomersService;
