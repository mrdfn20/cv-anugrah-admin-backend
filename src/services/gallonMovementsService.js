import GallonMovementsModel from '../models/gallonMovementsModel.js';

import moment from 'moment-timezone';

class GallonMovementsService {
  static async getAllMovements(grouped = false) {
    const results = await GallonMovementsModel.getAllMovements();

    const dataByCustomer = {};
    const resultFlat = [];

    results.forEach((row) => {
      const customerId = row.customer_id;
      const filled = row.gallon_filled || 0;
      const empty = row.gallon_empty || 0;
      const returned = row.gallon_returned || 0;

      if (!dataByCustomer[customerId]) {
        dataByCustomer[customerId] = { saldo: 0, transactions: [] };
      }

      let saldo = dataByCustomer[customerId].saldo;
      saldo = saldo + filled - (empty + returned);
      dataByCustomer[customerId].saldo = saldo;

      const trx = {
        customer_id: customerId,
        transaction_id: row.transaction_id,
        transaction_date: moment(row.transaction_date)
          .tz('Asia/Jakarta')
          .format('YYYY-MM-DD'),
        gallon_filled: filled,
        gallon_empty: empty,
        gallon_returned: returned,
        saldo_galon: saldo,
      };

      dataByCustomer[customerId].transactions.push(trx);
      resultFlat.push(trx);
    });

    if (grouped) {
      const resultGrouped = {};
      for (let customerId in dataByCustomer) {
        resultGrouped[customerId] = dataByCustomer[customerId].transactions;
      }
      return resultGrouped;
    }

    return resultFlat;
  }

  static async getMovementsByCustomerId(customer_id) {
    const transactions = await GallonMovementsModel.getMovementsByCustomerId(
      customer_id
    );

    let saldo = 0;
    const movements = transactions.map((row) => {
      const filled = row.gallon_filled || 0;
      const empty = row.gallon_empty || 0;
      const returned = row.gallon_returned || 0;

      saldo = saldo + filled - (empty + returned);

      return {
        transaction_id: row.transaction_id,
        transaction_date: moment(row.transaction_date)
          .tz('Asia/Jakarta')
          .format('YYYY-MM-DD'),
        gallon_filled: filled,
        gallon_empty: empty,
        gallon_returned: returned,
        saldo_galon: saldo,
      };
    });

    return movements;
  }
}

export default GallonMovementsService;
