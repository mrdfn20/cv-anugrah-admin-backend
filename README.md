# CV Anugrah Gemilang Backend

Backend API service for CV Anugrah Gemilang's internal management system. This Express.js application provides APIs for customer management, transaction processing, gallon tracking, and dashboard analytics.

## Features

- 🔐 **JWT Authentication & Role-based Access Control**
- 👥 **Customer Management System**
- 💰 **Transaction & Payment Processing**
- 📊 **Dashboard Analytics**
- 🧾 **Debt Management & Payment Tracking**
- 🚰 **Gallon Movement & Stock Tracking**
- 🔍 **Global Search Functionality**
- 📝 **Audit Logging**

## Technology Stack

- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Password Hashing**: bcrypt
- **Date Management**: moment-timezone

## Prerequisites

- Node.js v14+ 
- MySQL 5.7+
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cv-anugrah-backend.git
cd cv-anugrah-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
PORT=5000
HOST=localhost
USER=your_database_user
PASSWORD=your_database_password
DATABASE=your_database_name
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
```

4. Start the development server:

```bash
npm run start-dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - Login and get access token
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate tokens

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Add new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `GET /api/transactions/customer/:id` - Get transactions by customer ID
- `GET /api/transactions/filter` - Filter transactions
- `POST /api/transactions` - Add new transaction
- `DELETE /api/transactions/:id` - Delete transaction (soft delete)
- `PUT /api/transactions/restore/:id` - Restore deleted transaction

### Payment Logs
- `GET /api/paymentlogs` - Get all payment logs
- `GET /api/paymentlogs/:id` - Get payment log by ID
- `GET /api/paymentlogs/transaction/:id` - Get payment logs by transaction ID
- `GET /api/paymentlogs/getdebts` - Get debts with various filters
- `POST /api/paymentlogs` - Add payment log
- `POST /api/paymentlogs/paydebt` - Record debt payment

### Customer Balance
- `GET /api/customerbalance` - Get all customer balances
- `GET /api/customerbalance/:id` - Get customer balance by ID
- `POST /api/customerbalance` - Add customer balance
- `PUT /api/customerbalance` - Update customer balance

### Gallon Management
- `GET /api/gallon/stock` - Get all gallon stock recap
- `GET /api/gallon/stock/:customer_id` - Get gallon stock by customer ID
- `GET /api/gallon/stock/filter` - Filter gallon stock records
- `GET /api/gallon/price/:customer_id` - Get gallon price by customer ID

### Gallon Movements
- `GET /api/gallonmovements` - Get all gallon movements
- `GET /api/gallonmovements/:customer_id` - Get gallon movements by customer ID

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/income-summary` - Get income summary
- `GET /api/dashboard/gallon-summary` - Get gallon summary
- `GET /api/dashboard/active-customers` - Get active customers count
- `GET /api/dashboard/debt-status` - Get debt status summary
- `GET /api/dashboard/today-activity` - Get today's activities

### Search
- `GET /api/search` - Global search functionality

### User Management
- `GET /api/user` - Get all users (Admin only)
- `DELETE /api/user` - Delete user (Admin only)

### Audit Logs
- `GET /api/auditlogs` - Get audit logs (Admin only)

## Project Structure

```
src/
├── config/           # Configuration files
│   └── db.js         # Database connection
├── controllers/      # Request handlers
├── helpers/          # Helper functions
├── middlewares/      # Custom middleware
├── models/           # Database models
├── routes/           # API routes
├── services/         # Business logic
├── validators/       # Request validation schemas
└── server.js         # Application entry point
```

## Authentication & Authorization

This API uses JWT for authentication. Include the token in your requests:

```
Authorization: Bearer your_access_token
```

Three role levels are implemented:
- `Admin`: Full access to all endpoints
- `Editor`: Limited administrative access
- `Driver`: Limited read-only access to specific endpoints

## Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "error": "Additional error details (when available)"
}
```

## Audit Logging

All create, update, and delete operations are logged in the `audit_logs` table, including:
- User ID and role
- Action performed
- Endpoint accessed
- Request data
- Previous data state (for updates/deletes)
- IP address

## License

[MIT](LICENSE)

## Contributors

- Your Name - Initial work - [Your GitHub](https://github.com/yourusername)

## Acknowledgments

- Mention any libraries, tools, or people you want to acknowledge