import DashboardService from '../services/dashboardService.js';
import { successResponse, errorResponse } from '../helpers/responseHelper.js';

class DashboardController {
  static async getSummary(req, res) {
    try {
      const summary = await DashboardService.getSummary();
      return successResponse(
        res,
        'Dashboard summary fetched successfully',
        summary
      );
    } catch (error) {
      console.error('Error in getSummary:', error.message);
      return errorResponse(res, error);
    }
  }

  static async getIncomeSummary(req, res) {
    try {
      const summary = await DashboardService.getIncomeSummary();
      return successResponse(
        res,
        'Income summary fetched successfully',
        summary
      );
    } catch (error) {
      console.error('Error in getIncomeSummary:', error.message);
      return errorResponse(res, error);
    }
  }

  static async getTotalTransactions(req, res) {
    try {
      const totalTransactions = await DashboardService.getTotalTransactions();
      return successResponse(
        res,
        'total transactions fetched successfully',
        totalTransactions
      );
    } catch (error) {
      console.error('Error in  get total transactions:', error.message);
      return errorResponse(res, error);
    }
  }

  static async getTotalIncome(req, res) {
    try {
      const totalIncome = await DashboardService.getTotalIncome();
      return successResponse(
        res,
        'total Income fetched successfully',
        totalIncome
      );
    } catch (error) {
      console.error('Error in  get total income:', error.message);
      return errorResponse(res, error);
    }
  }

  static async getTotalCustomers(req, res) {
    try {
      const totalCustomers = await DashboardService.getTotalCustomers();
      return successResponse(
        res,
        'total customers fetched successfully',
        totalCustomers
      );
    } catch (error) {
      console.error('Error in  get total customers:', error.message);
      return errorResponse(res, error);
    }
  }

  static async getTotalDebt(req, res) {
    try {
      const totalDebt = await DashboardService.getTotalDebt();
      return successResponse(res, 'total debt fetched successfully', totalDebt);
    } catch (error) {
      console.error('Error in  get total debt:', error.message);
      return errorResponse(res, error);
    }
  }

  static async getGallonSummary(req, res) {
    try {
      const gallonSummary = await DashboardService.getGallonSummary();
      return successResponse(
        res,
        'Galloon summary fetched successfully',
        gallonSummary
      );
    } catch (error) {
      console.error('Error in getGallonSummary:', error.message);
      return errorResponse(res, error);
    }
  }

  static async getActiveCustomers(req, res) {
    try {
      const activeCustomer = await DashboardService.getActiveCustomers();
      return successResponse(
        res,
        'Active customer fetched successfully',
        activeCustomer
      );
    } catch (error) {
      console.error('Error in getActiveCustomers:', error.message);
      return errorResponse(res, error);
    }
  }

  static async getDebtStatus(req, res) {
    try {
      const debtStatus = await DashboardService.getDebtStatus();
      return successResponse(
        res,
        'Debt status fetched successfully',
        debtStatus
      );
    } catch (error) {
      console.error('Error in getDebtStatus:', error.message);
      return errorResponse(res, error);
    }
  }

  static async getTodayActivity(req, res) {
    try {
      const todayActivities = await DashboardService.getTodayActivity();
      return successResponse(
        res,
        "Today's activity fetched successfully",
        todayActivities
      );
    } catch (error) {
      console.error('Error in getTodayActivity:', error.message);
      return errorResponse(res, error);
    }
  }
}

export default DashboardController;
