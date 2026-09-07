// src/middlewares/cacheMiddleware.js

/**
 * Cache in-memory sederhana buat endpoint GET yang hasilnya SAMA buat semua user
 * (dashboard summary dll) - biar navigasi berulang ke halaman Dashboard gak nembak
 * query aggregate berat ke DB tiap kali dibuka. TTL pendek (default 30 detik) jadi
 * data gak pernah terasa "basi", cuma nahan beban query pas user gonta-ganti tab
 * atau refresh berkali-kali dalam waktu singkat.
 *
 * Cuma cocok buat endpoint yang: (1) GET doang, (2) hasilnya sama buat semua user
 * (bukan data per-user), (3) boleh telat maksimal sekian detik. JANGAN pasang di
 * endpoint yang datanya harus real-time presisi (misal abis submit transaksi baru,
 * atau daftar yang punya query/filter beda-beda per request).
 *
 * In-memory (bukan Redis) karena app-nya jalan 1 proses PM2 (mode: fork, bukan
 * cluster) - kalau nanti di-scale ke multi-proses/multi-server, cache ini perlu
 * diganti ke shared store (Redis dll), soalnya tiap proses bakal punya cache-nya
 * sendiri-sendiri.
 */

const store = new Map(); // key: originalUrl -> { body, expiresAt }

export function cacheMiddleware(ttlSeconds = 30) {
  const ttlMs = ttlSeconds * 1000;

  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = req.originalUrl;
    const cached = store.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.body);
    }

    // Tangkap res.json() biar hasilnya kesimpen ke cache sebelum beneran dikirim,
    // tapi cuma kalau response-nya sukses (jangan cache-in pesan error).
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        store.set(key, { body, expiresAt: Date.now() + ttlMs });
      }
      return originalJson(body);
    };

    next();
  };
}

/** Kosongin semua cache - dipanggil manual kalau nanti ada endpoint yang butuh invalidasi paksa */
export function clearCache() {
  store.clear();
}
