import { describe, it, expect, vi, beforeEach } from 'vitest';

function makeFakeConn() {
  return {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  };
}

let fakeConn;

vi.mock('../../config/db.js', () => ({
  default: {
    promise: () => ({
      getConnection: () => Promise.resolve(fakeConn),
    }),
  },
}));

import withTransaction from '../dbTransactionHelper.js';

describe('withTransaction', () => {
  beforeEach(() => {
    fakeConn = makeFakeConn();
  });

  it('sukses: beginTransaction -> callback -> commit, rollback GAK dipanggil, conn di-release', async () => {
    const result = await withTransaction(async (conn) => {
      expect(conn).toBe(fakeConn);
      return 'hasil-sukses';
    });

    expect(result).toBe('hasil-sukses');
    expect(fakeConn.beginTransaction).toHaveBeenCalledTimes(1);
    expect(fakeConn.commit).toHaveBeenCalledTimes(1);
    expect(fakeConn.rollback).not.toHaveBeenCalled();
    expect(fakeConn.release).toHaveBeenCalledTimes(1);
  });

  it('callback throw: rollback dipanggil, commit GAK dipanggil, error asli ke-throw ulang, conn tetap di-release', async () => {
    const originalError = new Error('step gagal di tengah');

    await expect(
      withTransaction(async () => {
        throw originalError;
      })
    ).rejects.toThrow('step gagal di tengah');

    expect(fakeConn.beginTransaction).toHaveBeenCalledTimes(1);
    expect(fakeConn.commit).not.toHaveBeenCalled();
    expect(fakeConn.rollback).toHaveBeenCalledTimes(1);
    expect(fakeConn.release).toHaveBeenCalledTimes(1);
  });

  it('conn selalu di-release meskipun rollback sendiri juga gagal', async () => {
    fakeConn.rollback.mockRejectedValue(new Error('rollback gagal'));

    await expect(
      withTransaction(async () => {
        throw new Error('step gagal');
      })
    ).rejects.toThrow(); // salah satu error (asli atau rollback) tetap ke-throw

    expect(fakeConn.release).toHaveBeenCalledTimes(1);
  });
});
