import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Connection pool (bukan single connection) - supaya request bersamaan gak rebutan
// 1 koneksi & aplikasi gak macet total kalau 1 koneksi putus. Interface `.promise().execute()`
// persis sama kayak single connection, jadi semua model existing gak perlu diubah sama sekali.
// Nama env var pakai prefix DB_ (bukan HOST/USER/PASSWORD polos) - nama generik kayak
// `USER` beresiko bentrok sama environment variable bawaan sistem/hosting provider.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Cek konektivitas saat startup (fail-fast, sama kayak perilaku createConnection sebelumnya)
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ [ERROR] Connection to Database Failed:', err.message);
    process.exit(1); // Keluar dari aplikasi jika koneksi gagal
  } else {
    console.log('✅ Connected to Database Successfully (pool)');
    conn.release();
  }
});

pool.on('error', (err) => {
  console.error('❌ [ERROR] Unexpected database pool error:', err.message);
});

// Mengekspor pool agar bisa digunakan di file lain (nama tetap `dbConnection` biar
// semua import existing gak perlu diubah)
export default pool;
