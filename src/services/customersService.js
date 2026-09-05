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

  deleteCustomerById: (req, customer_id, callback) => {
    return CustomersModel.deleteCustomerById(customer_id, (err, results) => {
      if (!err && results.affectedRows > 0) {
        logHelper(req, {
          action: 'DELETE',
          endpoint: '/customers/:id',
          requestData: { customer_id },
        });
      }
      return callback(err, results);
    });
  },

  restoreCustomerById: (req, customer_id, callback) => {
    return CustomersModel.restoreCustomerById(customer_id, (err, results) => {
      if (!err && results.affectedRows > 0) {
        logHelper(req, {
          action: 'RESTORE',
          endpoint: '/customers/restore/:id',
          requestData: { customer_id },
        });
      }
      return callback(err, results);
    });
  },

  getDeletedCustomers: (callback) => {
    return CustomersModel.getDeletedCustomers(callback);
  },

  getActivitySummary: async () => {
    const activeIds = await CustomersModel.getActiveCustomerIdsThisMonth();
    return activeIds;
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
