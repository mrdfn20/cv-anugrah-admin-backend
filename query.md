query untuk mencari tranksakis berdasarkan sub region
SELECT 
    t.id, 
    t.transaction_date, 
    t.customer_id, 
    sr.sub_region_name,
    t.transaction_type, 
    t.gallon_price_id, 
    t.total_price, 
    t.payment_amount
FROM transactions t
LEFT JOIN customers c ON t.customer_id = c.id
LEFT JOIN sub_regions sr ON c.sub_region_id = sr.id
WHERE sr.sub_region_name LIKE '%Cisait%';

query untuk merepak hutang
SELECT
t.transaction_date,
t.id AS transaction_id,
t.customer_id,
t.total_price,
COALESCE(SUM(pl.amount_paid), 0) AS total_paid,
(t.total_price - COALESCE(SUM(pl.amount_paid), 0)) AS remaining_debt,
CASE
WHEN (t.total_price - COALESCE(SUM(pl.amount_paid), 0)) = 0 THEN 'Lunas'
ELSE 'Belum Lunas'
END AS status_hutang
FROM transactions t
LEFT JOIN payment_logs pl ON t.id = pl.transaction_id
WHERE t.transaction_type = 'Hutang'
-- AND t.customer_id = 12
GROUP BY t.id, t.customer_id, t.total_price;

transactionModel :

const dbConnection = require('../config/db'); // Pastikan koneksi benar
const PaymentLogs = require('../models/paymentLogsModel');
const CustomerBalance = require('../models/customerBalanceModel');
const GallonModel = require('../models/gallonModel');

const Transactions = {
addTransaction: (
customer_id,
gallon_filled,
gallon_empty,
gallon_returned,
transaction_type,
armada_id,
payment_amount,
callback
) => {
// Ambil harga galon otomatis dari pelanggan
GallonModel.getGallonPriceById(customer_id, (err, results) => {
if (!results.length || !results[0].gallon_price_id) {
return callback(new Error('Customer or gallon price not found'), null);
}

      const { gallon_price_id, gallonPrice } = results[0];
      const total_price = gallonPrice * (gallon_filled || 0);

      if (isNaN(total_price) || total_price < 0) {
        return callback(new Error('Total price calculation error'), null);
      }

      // Ambil saldo pelanggan
      CustomerBalance.getCustomerBalanceById(customer_id, (err, results) => {
        if (err) return callback(err, null);

        let balance = results?.balance || 0;
        let amount_paid = 0;
        let balanceUsed = 0;

        // **Jika transaksi hutang, cek apakah ada balance atau pembayaran awal**
        if (transaction_type === 'Hutang') {
          if (balance > 0) {
            balanceUsed = Math.min(balance, total_price);
            amount_paid = balanceUsed; // **Saldo otomatis digunakan untuk bayar hutang**
          }

          // Jika pelanggan juga membayar sebagian hutangnya
          amount_paid += payment_amount;

          // ✅ **Jika masih ada hutang tersisa, hitung `remainingDebt`**
          let remainingDebt = total_price - amount_paid;

          // 🚨 **PASTIKAN `amount_paid` TIDAK SAMA DENGAN `total_price` PADA HUTANG**
          if (remainingDebt > 0) {
            amount_paid = balanceUsed + payment_amount; // Hanya yang dibayar, bukan `total_price`
          }
        } else {
          amount_paid = total_price; // Jika transaksi tunai, bayar penuh
        }

        // ✅ **Jika saldo digunakan, update balance pelanggan**
        if (balanceUsed > 0) {
          const updateBalanceQuery = `
                  UPDATE customer_balances SET balance = balance - ?
                  WHERE customer_id = ?
                `;
          dbConnection.query(updateBalanceQuery, [balanceUsed, customer_id]);
        }

        // ✅ **Simpan transaksi ke database**
        const insertTransaction = `
              INSERT INTO transactions
              (transaction_date, customer_id, gallon_filled, gallon_empty, gallon_returned,
              transaction_type, armada_id, gallon_price_id, total_price, payment_amount)
              VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

        dbConnection.query(
          insertTransaction,
          [
            customer_id,
            gallon_filled,
            gallon_empty,
            gallon_returned,
            transaction_type,
            armada_id,
            gallon_price_id,
            total_price,
            amount_paid,
          ],
          (err, results) => {
            if (err) return callback(err, null);

            const transactionId = results.insertId;

            // ✅ **Jika transaksi hutang & masih ada sisa hutang, masukkan ke `payment_logs`**
            let remainingDebt = total_price - amount_paid;

            if (transaction_type === 'Hutang' && remainingDebt > 0) {
              const owe_date = new Date().toISOString().slice(0, 10);
              const payment_date = null;

              PaymentLogs.addPaymentLogs(
                transactionId,
                customer_id,
                owe_date,
                payment_date,
                remainingDebt, // ✅ **Gunakan `remainingDebt`, bukan `amount_paid`**
                (err, paymentResult) => {
                  if (err) return callback(err, null);
                  return callback(null, {
                    transactionId,
                    paymentLogId: paymentResult.insertId,
                  });
                }
              );
            } else {
              return callback(null, { transactionId });
            }
          }
        );
      });
    });

},
getAllTransactions: (callback) => {
dbConnection.query(`SELECT * FROM transactions`, (err, results) => {
callback(err, results);
});
},
getTransactionById: (transaction_id, callback) => {
dbConnection.query(
`SELECT * FROM transactions WHERE id = ?`,
[transaction_id],
(err, results) => {
callback(err, results[0]);
}
);
},
getTransactionByCustomerId: (customer_id, callback) => {
dbConnection.query(
`SELECT * FROM transactions WHERE customer_id = ?`,
[customer_id],
(err, results) => {
callback(err, results);
}
);
},
getTransactionByDate: (date, callback) => {
dbConnection.query(
`SELECT * FROM transaction WHERE transaction_date = ?`,
[date],
(err, results) => {
callback(err, results);
}
);
},
};

module.exports = Transactions;


paydebt model 

payDebt: (transaction_id, payment_date, amount_paid, callback) => {
    // 1️⃣ Cari hutang yang belum lunas berdasarkan transaction_id
    const queryFindDebt = `
      SELECT t.id AS transaction_id, t.customer_id, t.transaction_date, 
             t.total_price, COALESCE(SUM(pl.amount_paid), 0) AS total_paid
      FROM transactions t
      LEFT JOIN payment_logs pl ON t.id = pl.transaction_id
      WHERE t.id = ? AND t.transaction_type = 'Hutang'
      GROUP BY t.id, t.customer_id, t.transaction_date, t.total_price
      ORDER BY t.transaction_date ASC
    `;

    dbConnection.query(queryFindDebt, [transaction_id], (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0)
        return callback(null, {
          message: 'No debt found for this transaction.',
        });

      let transaction = results[0];
      let remainingDebt = transaction.total_price - transaction.total_paid;

      if (remainingDebt <= 0) {
        return callback(null, { message: 'Debt is already fully paid.' });
      }

      // 2️⃣ Cek saldo pelanggan di customer_balances
      CustomerBalance.getCustomerBalanceById(
        transaction.customer_id,
        (err, result) => {
          if (err) return callback(err, null);

          let customerBalance = result ? result.balance : 0;

          // Jika pelanggan belum punya akun balance, buatkan dengan balance = 0
          if (!customerBalance) {
            CustomerBalance.addCustomerBalance(
              transaction.customer_id,
              0,
              (err, result) => {
                if (err) return callback(err, null);
                customerBalance = 0; // Pastikan balance 0 jika baru dibuat
              }
            );
          }

          // 3️⃣ Hitung pembayaran hutang dan sisa saldo
          let paymentForDebt = Math.min(
            amount_paid + customerBalance,
            remainingDebt
          );
          let extraBalance = amount_paid + customerBalance - paymentForDebt;
          let balanceUsed = Math.min(customerBalance, remainingDebt); // Berapa balance yang dipakai

          // 4️⃣ Jika balance dipakai, update saldo balance pelanggan
          if (balanceUsed > 0) {
            CustomerBalance.reduceCustomerBalance(
              transaction.customer_id,
              balanceUsed,
              (err, result) => {
                if (err) return callback(err, null);
              }
            );
          }

          // 5️⃣ Masukkan pembayaran ke payment_logs
          const queryInsertPayment = `
                INSERT INTO payment_logs (transaction_id, customer_id, owe_date, payment_date, amount_paid) 
                VALUES (?, ?, ?, ?, ?)
            `;

          dbConnection.query(
            queryInsertPayment,
            [
              transaction.transaction_id,
              transaction.customer_id,
              transaction.transaction_date,
              payment_date || new Date().toISOString().slice(0, 10),
              paymentForDebt,
            ],
            (err, paymentResult) => {
              if (err) return callback(err, null);

              let response = {
                message: 'Payment recorded successfully.',
                paymentLogId: paymentResult.insertId,
                transactionId: transaction.transaction_id,
                remainingDebt: remainingDebt - paymentForDebt,
              };

              // 6️⃣ Jika ada kelebihan pembayaran, simpan ke customer_balance
              if (extraBalance > 0) {
                CustomerBalance.updateCustomerBalance(
                  transaction.customer_id,
                  extraBalance,
                  (err, balanceResult) => {
                    if (err) return callback(err, null);
                    response.message =
                      'Payment recorded successfully, extra balance added to customer.';
                    response.extraBalance = balanceResult;
                    return callback(null, response);
                  }
                );
              } else {
                return callback(null, response);
              }
            }
          );
        }
      );
    });
  },