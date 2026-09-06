import ReportsModel from '../models/reportsModel.js';

const ReportsService = {
  async getSummaryByPeriod(startDate, endDate, customerId) {
    return await ReportsModel.getSummaryByPeriod(startDate, endDate, customerId);
  },

  async getSummaryByRegion(startDate, endDate) {
    return await ReportsModel.getSummaryByRegion(startDate, endDate);
  },
};

export default ReportsService;
