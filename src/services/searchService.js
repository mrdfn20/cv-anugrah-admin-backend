// services/searchService.js
import SearchModel from '../models/searchModel.js';

class SearchService {
  static async globalSearch(query) {
    const [customers, transactions, debts] = await Promise.all([
      SearchModel.searchCustomers(query),
      SearchModel.searchTransactions(query),
      SearchModel.searchDebts(query),
    ]);

    return {
      customers,
      transactions,
      debts,
    };
  }
}

export default SearchService;
