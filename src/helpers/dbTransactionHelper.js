import dbConnection from '../config/db.js';

/**
 * Jalankan sekumpulan query dalam 1 DB transaction (BEGIN/COMMIT/ROLLBACK).
 * Dipakai untuk operasi finansial multi-step (mis. kurangi saldo -> insert transaksi
 * -> insert payment log) supaya kalau ada 1 step gagal, semua step lain ikut di-rollback -
 * data gak nyangkut setengah-setengah.
 *
 * @param {(conn: import('mysql2').PoolConnection) => Promise<any>} callback
 *   Terima 1 koneksi khusus (bukan pool default) - lempar koneksi ini ke setiap
 *   model call di dalam `callback` (mis. `Model.insertX(data, conn)`) supaya semuanya
 *   ikut dalam transaction yang sama.
 * @returns {Promise<any>} Hasil return dari `callback` kalau sukses.
 * @throws Error asli dari `callback` kalau gagal (sudah di-rollback duluan).
 */
export async function withTransaction(callback) {
  const conn = await dbConnection.promise().getConnection();

  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export default withTransaction;
