import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('../../models/userModel.js', () => ({
  default: {
    getUserByUsername: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
  },
}));
vi.mock('../../models/refreshTokenModel.js', () => ({
  default: {
    deleteTokensByUser: vi.fn(),
    saveToken: vi.fn(),
    findToken: vi.fn(),
    deleteToken: vi.fn(),
  },
}));

import authService from '../authService.js';
import User from '../../models/userModel.js';
import RefreshTokenModel from '../../models/refreshTokenModel.js';

beforeAll(() => {
  vi.stubEnv('JWT_SECRET', 'test-secret-access');
  vi.stubEnv('JWT_REFRESH_SECRET', 'test-secret-refresh');
});

describe('authService.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('username udah dipakai -> throw, gak jadi bikin user baru', async () => {
    User.getUserByUsername.mockResolvedValue({ id: 1, username: 'dev_admin' });

    await expect(
      authService.register({ username: 'dev_admin', password: 'x', role: 'Admin' })
    ).rejects.toThrow('User already exists');

    expect(User.createUser).not.toHaveBeenCalled();
  });

  it('username baru -> password di-hash (bukan disimpan plaintext) sebelum insert', async () => {
    User.getUserByUsername.mockResolvedValue(null);
    User.createUser.mockResolvedValue({ insertId: 5 });

    await authService.register({ username: 'editor1', password: 'RahasiaBanget', role: 'Editor' });

    expect(User.createUser).toHaveBeenCalledTimes(1);
    const [username, hashedPassword, role] = User.createUser.mock.calls[0];
    expect(username).toBe('editor1');
    expect(role).toBe('Editor');
    expect(hashedPassword).not.toBe('RahasiaBanget'); // bukan plaintext
    expect(await bcrypt.compare('RahasiaBanget', hashedPassword)).toBe(true); // tapi tetep valid hash-nya
  });
});

describe('authService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('username gak ketemu -> throw', async () => {
    User.getUserByUsername.mockResolvedValue(null);

    await expect(
      authService.login({ username: 'gak-ada', password: 'apapun' })
    ).rejects.toThrow('User not found');
  });

  it('password salah -> throw, gak jadi generate token / simpan refresh token', async () => {
    const realHash = await bcrypt.hash('PasswordBenar', 12);
    User.getUserByUsername.mockResolvedValue({ id: 1, username: 'dev_admin', role: 'Admin', password: realHash });

    await expect(
      authService.login({ username: 'dev_admin', password: 'PasswordSalah' })
    ).rejects.toThrow('Wrong password');

    expect(RefreshTokenModel.saveToken).not.toHaveBeenCalled();
  });

  it('password bener -> dapet access & refresh token yang valid, refresh token lama dihapus dulu', async () => {
    const realHash = await bcrypt.hash('PasswordBenar', 12);
    User.getUserByUsername.mockResolvedValue({ id: 7, username: 'dev_admin', role: 'Admin', password: realHash });

    const result = await authService.login({ username: 'dev_admin', password: 'PasswordBenar' });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();

    const decodedAccess = jwt.verify(result.accessToken, 'test-secret-access');
    expect(decodedAccess).toMatchObject({ id: 7, username: 'dev_admin', role: 'Admin' });

    // Refresh token lama dihapus SEBELUM yang baru disimpan (urutan penting)
    expect(RefreshTokenModel.deleteTokensByUser).toHaveBeenCalledWith(7);
    expect(RefreshTokenModel.saveToken).toHaveBeenCalledWith(7, result.refreshToken);
  });
});

describe('authService.refreshAccessToken', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refresh token gak dikirim -> throw', async () => {
    await expect(authService.refreshAccessToken(null)).rejects.toThrow('No refresh token provided');
  });

  it('refresh token gak ada di DB (udah logout/kadaluarsa) -> throw', async () => {
    RefreshTokenModel.findToken.mockResolvedValue(null);

    await expect(authService.refreshAccessToken('token-random')).rejects.toThrow('Invalid refresh token');
  });

  it('refresh token valid -> dapet access token baru dgn role terbaru dari DB', async () => {
    const refreshToken = jwt.sign({ id: 3 }, 'test-secret-refresh', { expiresIn: '3d' });
    RefreshTokenModel.findToken.mockResolvedValue({ token: refreshToken });
    User.getUserById.mockResolvedValue({ id: 3, role: 'Editor' });

    const newAccessToken = await authService.refreshAccessToken(refreshToken);

    const decoded = jwt.verify(newAccessToken, 'test-secret-access');
    expect(decoded).toMatchObject({ id: 3, role: 'Editor' });
  });
});
