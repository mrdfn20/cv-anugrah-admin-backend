import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import cookieParser from 'cookie-parser';

const app = express();
dotenv.config();

// Import routes
import customerRoutes from './routes/customers.js';
import paymentRoutes from './routes/paymentLogs.js';
import customerBalanceRoutes from './routes/customerBalance.js';
import transactionsRoutes from './routes/transactions.js';
import authentications from './routes/authentications.js';
import userRoutes from './routes/user.js';
import gallonRoutes from './routes/gallon.js';
import gallonMovementRoutes from './routes/gallonMovements.js';
import dashboardRoutes from './routes/dashboard.js';
import searchRoutes from './routes/search.js';
import auditLogs from './routes/auditLogs.js';

// Middleware Configuration
app.use(cors()); // Mengizinkan akses API dari domain lain (CORS)
app.use(bodyParser.urlencoded({ extended: false })); // Parsing request dengan format application/x-www-form-urlencoded
app.use(bodyParser.json()); // Parsing request dengan format JSON
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});
app.use(cookieParser()); // bisa akses req.cookies.refreshToken di controller.

morgan.token('id', (req) => req.id);
morgan.token('time', () => {
  const now = moment();
  return now.format('YYYY-MM-DD HH:mm:ss');
});

app.use(
  morgan((tokens, req, res) => {
    return JSON.stringify({
      id: tokens.id(req, res),
      time: tokens.time(req, res),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: parseInt(tokens.status(req, res), 10),
      contentLength: tokens.res(req, res, 'content-length'),
      respontime: `${tokens['response-time'](req, res)} ms - `,
      userAgent: tokens['user-agent'](req, res), // Ini untuk aplikasi/browser
    });
  })
);

// API Routing
app.use('/api/customers', customerRoutes);
app.use('/api/paymentlogs', paymentRoutes);
app.use('/api/customerbalance', customerBalanceRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/auth', authentications);
app.use('/api/user', userRoutes);
app.use('/api/gallon', gallonRoutes);
app.use('/api/gallonmovements', gallonMovementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/auditlogs', auditLogs);

// Default Route
app.get('/', (req, res) => {
  res.send('Web Server Cv. Activated');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, (error) => {
  if (error) {
    console.error("❌ Error occurred, server can't start:", error);
  } else {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  }
});
