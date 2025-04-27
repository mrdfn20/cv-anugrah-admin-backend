import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Membuat koneksi ke database menggunakan konfigurasi dari .env
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

// Menghubungkan ke database dan menangani error jika terjadi
connection.connect((err) => {
  if (err) {
    console.error('❌ [ERROR] Connection to Database Failed:', err.message);
    process.exit(1); // Keluar dari aplikasi jika koneksi gagal
  } else {
    console.log('✅ Connected to Database Successfully');
  }
});

// Mengekspor koneksi agar bisa digunakan di file lain
export default connection;
