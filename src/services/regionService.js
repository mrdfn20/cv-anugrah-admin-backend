import RegionModel from '../models/regionModel.js';
import logHelper from '../helpers/logHelper.js';

const RegionService = {
  async getAllRegions() {
    return await RegionModel.getAllRegions();
  },

  async createRegion(req, region_name, region_type) {
    const insertId = await RegionModel.createRegion(region_name, region_type);

    await logHelper(req, {
      action: 'CREATE',
      endpoint: '/regions',
      requestData: { region_name, region_type },
    });

    return { id: insertId, region_name, region_type };
  },

  async updateRegion(req, id, region_name, region_type) {
    const existing = await RegionModel.getRegionById(id);
    if (!existing) {
      throw new Error('Region not found');
    }

    await RegionModel.updateRegion(id, region_name, region_type);

    await logHelper(req, {
      action: 'UPDATE',
      endpoint: '/regions/:id',
      requestData: { region_name, region_type },
      previousData: existing,
    });

    return { id: Number(id), region_name, region_type };
  },

  async deleteRegion(req, id) {
    const existing = await RegionModel.getRegionById(id);
    if (!existing) {
      throw new Error('Region not found');
    }

    const subRegionCount = await RegionModel.countSubRegionsUsingRegion(id);
    if (subRegionCount > 0) {
      throw new Error(
        `Region masih punya ${subRegionCount} sub-wilayah, tidak bisa dihapus`
      );
    }

    await RegionModel.deleteRegion(id);

    await logHelper(req, {
      action: 'DELETE',
      endpoint: '/regions/:id',
      requestData: { id },
      previousData: existing,
    });

    return { message: 'Region deleted successfully' };
  },

  async getAllSubRegions() {
    return await RegionModel.getAllSubRegions();
  },

  async createSubRegion(req, region_id, sub_region_name) {
    const region = await RegionModel.getRegionById(region_id);
    if (!region) {
      throw new Error('Region not found');
    }

    const insertId = await RegionModel.createSubRegion(region_id, sub_region_name);

    await logHelper(req, {
      action: 'CREATE',
      endpoint: '/regions/sub-regions',
      requestData: { region_id, sub_region_name },
    });

    return { id: insertId, region_id, sub_region_name };
  },

  async updateSubRegion(req, id, region_id, sub_region_name) {
    const existing = await RegionModel.getSubRegionById(id);
    if (!existing) {
      throw new Error('Sub-region not found');
    }

    const region = await RegionModel.getRegionById(region_id);
    if (!region) {
      throw new Error('Region not found');
    }

    await RegionModel.updateSubRegion(id, region_id, sub_region_name);

    await logHelper(req, {
      action: 'UPDATE',
      endpoint: '/regions/sub-regions/:id',
      requestData: { region_id, sub_region_name },
      previousData: existing,
    });

    return { id: Number(id), region_id, sub_region_name };
  },

  async deleteSubRegion(req, id) {
    const existing = await RegionModel.getSubRegionById(id);
    if (!existing) {
      throw new Error('Sub-region not found');
    }

    const customerCount = await RegionModel.countCustomersUsingSubRegion(id);
    if (customerCount > 0) {
      throw new Error(
        `Sub-wilayah masih dipakai di ${customerCount} pelanggan, tidak bisa dihapus`
      );
    }

    await RegionModel.deleteSubRegion(id);

    await logHelper(req, {
      action: 'DELETE',
      endpoint: '/regions/sub-regions/:id',
      requestData: { id },
      previousData: existing,
    });

    return { message: 'Sub-region deleted successfully' };
  },
};

export default RegionService;
