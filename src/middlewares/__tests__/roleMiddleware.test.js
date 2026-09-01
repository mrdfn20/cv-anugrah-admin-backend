import { describe, it, expect, vi, beforeEach } from 'vitest';
import roleMiddleware from '../roleMiddleware.js';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('roleMiddleware', () => {
  let next;

  beforeEach(() => {
    next = vi.fn();
  });

  it('role sesuai daftar yang diizinkan -> next() dipanggil', () => {
    const middleware = roleMiddleware(['Admin', 'Editor']);
    const req = { user: { id: 1, role: 'Editor' } };
    const res = makeRes();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('role gak ada di daftar yang diizinkan -> 403, next() gak dipanggil', () => {
    const middleware = roleMiddleware(['Admin']);
    const req = { user: { id: 1, role: 'Driver' } };
    const res = makeRes();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('req.user gak ada sama sekali (belum lolos authMiddleware) -> 403', () => {
    const middleware = roleMiddleware(['Admin']);
    const req = {};
    const res = makeRes();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
