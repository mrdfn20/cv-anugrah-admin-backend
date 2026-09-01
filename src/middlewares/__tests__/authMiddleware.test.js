import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import authMiddleware from '../authMiddleware.js';

// Override JWT_SECRET di runtime (bukan pas module-load) - authMiddleware baca
// process.env.JWT_SECRET di dalam function body-nya tiap kali dipanggil, jadi
// override ini kepakai gak peduli isi .env asli project.
const TEST_SECRET = 'test-secret-key-utk-vitest';

beforeAll(() => {
  vi.stubEnv('JWT_SECRET', TEST_SECRET);
});

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('authMiddleware', () => {
  let next;

  beforeEach(() => {
    next = vi.fn();
  });

  it('token valid -> next() dipanggil, req.user keisi dari payload', () => {
    const token = jwt.sign({ id: 1, username: 'dev_admin', role: 'Admin' }, TEST_SECRET, {
      expiresIn: '1h',
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 1, username: 'dev_admin', role: 'Admin' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('gak ada header Authorization -> 401, next() gak dipanggil', () => {
    const req = { headers: {} };
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('token invalid (bukan JWT valid) -> 403, next() gak dipanggil', () => {
    const req = { headers: { authorization: 'Bearer bukan-token-valid' } };
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('token expired -> 403, next() gak dipanggil', () => {
    const expiredToken = jwt.sign({ id: 1, role: 'Admin' }, TEST_SECRET, {
      expiresIn: -10, // udah expired 10 detik yang lalu
    });
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('token ditandatangani dgn secret berbeda -> ditolak', () => {
    const wrongSecretToken = jwt.sign({ id: 1, role: 'Admin' }, 'secret-yang-salah');
    const req = { headers: { authorization: `Bearer ${wrongSecretToken}` } };
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
