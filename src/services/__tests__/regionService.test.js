import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/regionModel.js', () => ({
  default: {
    getRegionById: vi.fn(),
    createRegion: vi.fn(),
    updateRegion: vi.fn(),
    deleteRegion: vi.fn(),
    countSubRegionsUsingRegion: vi.fn(),
    getSubRegionById: vi.fn(),
    createSubRegion: vi.fn(),
    updateSubRegion: vi.fn(),
    deleteSubRegion: vi.fn(),
    countCustomersUsingSubRegion: vi.fn(),
  },
}));

vi.mock('../../helpers/logHelper.js', () => ({ default: vi.fn() }));

import RegionService from '../regionService.js';
import RegionModel from '../../models/regionModel.js';

const req = {};

describe('regionService.deleteRegion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('region gak ketemu -> throw, gak lanjut cek sub-region', async () => {
    RegionModel.getRegionById.mockResolvedValue(null);
    await expect(RegionService.deleteRegion(req, 999)).rejects.toThrow('Region not found');
    expect(RegionModel.countSubRegionsUsingRegion).not.toHaveBeenCalled();
    expect(RegionModel.deleteRegion).not.toHaveBeenCalled();
  });

  it('region masih punya sub-region -> ditolak, gak jadi dihapus', async () => {
    RegionModel.getRegionById.mockResolvedValue({ id: 1, region_name: 'Ciruas' });
    RegionModel.countSubRegionsUsingRegion.mockResolvedValue(5);
    await expect(RegionService.deleteRegion(req, 1)).rejects.toThrow(
      'Region masih punya 5 sub-wilayah, tidak bisa dihapus'
    );
    expect(RegionModel.deleteRegion).not.toHaveBeenCalled();
  });

  it('region gak punya sub-region sama sekali -> berhasil dihapus', async () => {
    RegionModel.getRegionById.mockResolvedValue({ id: 1, region_name: 'Ciruas' });
    RegionModel.countSubRegionsUsingRegion.mockResolvedValue(0);
    RegionModel.deleteRegion.mockResolvedValue({ affectedRows: 1 });
    const result = await RegionService.deleteRegion(req, 1);
    expect(result.message).toBe('Region deleted successfully');
    expect(RegionModel.deleteRegion).toHaveBeenCalledWith(1);
  });
});

describe('regionService.deleteSubRegion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sub-region gak ketemu -> throw', async () => {
    RegionModel.getSubRegionById.mockResolvedValue(null);
    await expect(RegionService.deleteSubRegion(req, 999)).rejects.toThrow(
      'Sub-region not found'
    );
    expect(RegionModel.countCustomersUsingSubRegion).not.toHaveBeenCalled();
  });

  it('sub-region masih dipakai pelanggan -> ditolak', async () => {
    RegionModel.getSubRegionById.mockResolvedValue({ id: 3, sub_region_name: 'Cisait' });
    RegionModel.countCustomersUsingSubRegion.mockResolvedValue(12);
    await expect(RegionService.deleteSubRegion(req, 3)).rejects.toThrow(
      'Sub-wilayah masih dipakai di 12 pelanggan, tidak bisa dihapus'
    );
    expect(RegionModel.deleteSubRegion).not.toHaveBeenCalled();
  });

  it('sub-region gak dipakai pelanggan sama sekali -> berhasil dihapus', async () => {
    RegionModel.getSubRegionById.mockResolvedValue({ id: 3, sub_region_name: 'Cisait' });
    RegionModel.countCustomersUsingSubRegion.mockResolvedValue(0);
    RegionModel.deleteSubRegion.mockResolvedValue({ affectedRows: 1 });
    const result = await RegionService.deleteSubRegion(req, 3);
    expect(result.message).toBe('Sub-region deleted successfully');
  });
});

describe('regionService.createSubRegion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('region induk gak ketemu -> throw, gak jadi bikin sub-region yatim', async () => {
    RegionModel.getRegionById.mockResolvedValue(null);
    await expect(RegionService.createSubRegion(req, 999, 'Test')).rejects.toThrow(
      'Region not found'
    );
    expect(RegionModel.createSubRegion).not.toHaveBeenCalled();
  });

  it('region induk valid -> berhasil dibuat', async () => {
    RegionModel.getRegionById.mockResolvedValue({ id: 1, region_name: 'Ciruas' });
    RegionModel.createSubRegion.mockResolvedValue(50);
    const result = await RegionService.createSubRegion(req, 1, 'Desa Baru');
    expect(result).toEqual({ id: 50, region_id: 1, sub_region_name: 'Desa Baru' });
  });
});
