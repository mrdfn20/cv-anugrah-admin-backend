import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/armadaModel.js', () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countTransactionsUsingArmada: vi.fn(),
  },
}));

import ArmadaService from '../armadaService.js';
import ArmadaModel from '../../models/armadaModel.js';

describe('armadaService.delete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('armada gak ketemu -> throw, gak lanjut cek transaksi', async () => {
    ArmadaModel.getById.mockResolvedValue(null);

    await expect(ArmadaService.delete(999)).rejects.toThrow('Armada not found');
    expect(ArmadaModel.countTransactionsUsingArmada).not.toHaveBeenCalled();
    expect(ArmadaModel.delete).not.toHaveBeenCalled();
  });

  it('armada masih dipakai transaksi -> ditolak, gak jadi dihapus', async () => {
    ArmadaModel.getById.mockResolvedValue({ id: 1, armada_name: 'Pickup APV' });
    ArmadaModel.countTransactionsUsingArmada.mockResolvedValue(3);

    await expect(ArmadaService.delete(1)).rejects.toThrow(
      'Armada masih dipakai di 3 transaksi, tidak bisa dihapus'
    );
    expect(ArmadaModel.delete).not.toHaveBeenCalled();
  });

  it('armada gak dipakai transaksi sama sekali -> berhasil dihapus', async () => {
    ArmadaModel.getById.mockResolvedValue({ id: 1, armada_name: 'Pickup APV' });
    ArmadaModel.countTransactionsUsingArmada.mockResolvedValue(0);
    ArmadaModel.delete.mockResolvedValue({ affectedRows: 1 });

    const result = await ArmadaService.delete(1);

    expect(result.message).toBe('Armada deleted successfully');
    expect(ArmadaModel.delete).toHaveBeenCalledWith(1);
  });
});

describe('armadaService.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('armada gak ketemu -> throw, gak jadi update', async () => {
    ArmadaModel.getById.mockResolvedValue(null);

    await expect(ArmadaService.update(999, 'Nama Baru')).rejects.toThrow('Armada not found');
    expect(ArmadaModel.update).not.toHaveBeenCalled();
  });

  it('armada ketemu -> berhasil update', async () => {
    ArmadaModel.getById.mockResolvedValue({ id: 1, armada_name: 'Lama' });
    ArmadaModel.update.mockResolvedValue({ affectedRows: 1 });

    const result = await ArmadaService.update(1, 'Baru');

    expect(result).toEqual({ id: 1, armada_name: 'Baru' });
  });
});
