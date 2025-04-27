// services/dashboardService.js
import DashboardModel from '../models/dashboardModel.js';

class DashboardService {
  static async getSummary() {
    const totalTransactions = await DashboardModel.getTotalTransactions();
    const totalIncome = await DashboardModel.getTotalIncome();
    const totalCustomers = await DashboardModel.getTotalCustomers();
    const totalDebt = await DashboardModel.getTotalDebt();

    return {
      totalTransactions,
      totalIncome,
      totalCustomers,
      totalDebt,
    };
  }

  static async getIncomeSummary() {
    const incomeByDate = await DashboardModel.getIncomeSummary();
    return incomeByDate;
  }

  static async getTotalTransactions() {
    const totalTransactions = await DashboardModel.getTotalTransactions();
    return totalTransactions;
  }

  static async getTotalIncome() {
    const totalIncome = await DashboardModel.getTotalIncome();
    return totalIncome;
  }

  static async getTotalCustomers() {
    const totalCustomers = await DashboardModel.getTotalCustomers();
    return totalCustomers;
  }

  static async getTotalDebt() {
    const totalDebt = await DashboardModel.getTotalDebt();
    return totalDebt;
  }

  // Endpoint: /gallon-summary
  static async getGallonSummary() {
    const result = await DashboardModel.getGallonSummary();
    return result;
  }

  // Endpoint: /active-customers
  static async getActiveCustomers() {
    const result = await DashboardModel.getActiveCustomers();
    return result;
  }

  static async getDebtStatus() {
    return await DashboardModel.getDebtStatus();
  }

  static async getTodayActivity() {
    return await DashboardModel.getTodayActivity();
  }
}

export default DashboardService;
