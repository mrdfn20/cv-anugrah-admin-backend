import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cacheMiddleware, clearCache } from '../cacheMiddleware.js';

function mockRes() {
  const res = { statusCode: 200 };
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('cacheMiddleware', () => {
  beforeEach(() => {
    clearCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('request pertama -> lolos ke handler asli (belum ada cache)', () => {
    const middleware = cacheMiddleware(30);
    const req = { method: 'GET', originalUrl: '/api/dashboard/summary' };
    const res = mockRes();
    const originalJson = res.json;
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    // res.json dibungkus middleware (buat nangkep hasilnya), tapi belum DIPANGGIL -
    // itu tanggung jawab controller di belakang next(), bukan middleware ini.
    expect(originalJson).not.toHaveBeenCalled();
  });

  it('request kedua dalam TTL -> langsung dari cache, gak panggil next() lagi', () => {
    const middleware = cacheMiddleware(30);
    const req = { method: 'GET', originalUrl: '/api/dashboard/summary' };

    // Request pertama: handler jalan, hasilnya di-cache
    const res1 = mockRes();
    const next1 = vi.fn();
    middleware(req, res1, next1);
    res1.json({ success: true, data: { total: 100 } });

    // Request kedua: harus dari cache, next() gak dipanggil
    const res2 = mockRes();
    const next2 = vi.fn();
    middleware(req, res2, next2);

    expect(next2).not.toHaveBeenCalled();
    expect(res2.json).toHaveBeenCalledWith({ success: true, data: { total: 100 } });
  });

  it('response error (status >= 400) gak ikut di-cache', () => {
    const middleware = cacheMiddleware(30);
    const req = { method: 'GET', originalUrl: '/api/dashboard/summary' };

    const res1 = mockRes();
    res1.statusCode = 500;
    const next1 = vi.fn();
    middleware(req, res1, next1);
    res1.json({ success: false, message: 'error' });

    // Request kedua harus tetap lolos ke handler (gak ada yang ke-cache)
    const res2 = mockRes();
    const next2 = vi.fn();
    middleware(req, res2, next2);

    expect(next2).toHaveBeenCalledTimes(1);
  });

  it('cache kadaluarsa setelah TTL lewat -> lolos ke handler lagi', () => {
    const middleware = cacheMiddleware(30);
    const req = { method: 'GET', originalUrl: '/api/dashboard/summary' };

    const res1 = mockRes();
    const next1 = vi.fn();
    middleware(req, res1, next1);
    res1.json({ success: true, data: {} });

    vi.advanceTimersByTime(31_000);

    const res2 = mockRes();
    const next2 = vi.fn();
    middleware(req, res2, next2);

    expect(next2).toHaveBeenCalledTimes(1);
  });

  it('method selain GET selalu lolos, gak pernah di-cache', () => {
    const middleware = cacheMiddleware(30);
    const req = { method: 'POST', originalUrl: '/api/dashboard/summary' };
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('URL beda -> gak nyampur cache-nya', () => {
    const middleware = cacheMiddleware(30);

    const reqA = { method: 'GET', originalUrl: '/api/dashboard/summary' };
    const resA = mockRes();
    middleware(reqA, resA, vi.fn());
    resA.json({ data: 'A' });

    const reqB = { method: 'GET', originalUrl: '/api/dashboard/debt-status' };
    const resB = mockRes();
    const nextB = vi.fn();
    middleware(reqB, resB, nextB);

    // Belum pernah di-cache buat URL ini -> tetap lolos ke handler
    expect(nextB).toHaveBeenCalledTimes(1);
  });
});
