import RegionModel from '../models/regionModel.js';
import RegionService from '../services/regionService.js';
import {
  successResponse,
  validationErrorResponse,
  notFoundErrorResponse,
  conflictErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

const VALID_REGION_TYPES = ['Kota', 'Kabupaten'];

export const getAllRegions = async (req, res) => {
  try {
    const results = await RegionModel.getAllRegions();
    return successResponse(res, 'Regions retrieved successfully', results, null, 200);
  } catch (error) {
    console.error('[GET ALL REGIONS ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data region', error);
  }
};

export const createRegion = async (req, res) => {
  try {
    const { region_name, region_type } = req.body;

    if (!region_name || !String(region_name).trim()) {
      return validationErrorResponse(res, ['Nama kecamatan wajib diisi']);
    }
    if (!VALID_REGION_TYPES.includes(region_type)) {
      return validationErrorResponse(res, [
        `Tipe wilayah harus salah satu dari: ${VALID_REGION_TYPES.join(', ')}`,
      ]);
    }

    const region = await RegionService.createRegion(
      req,
      String(region_name).trim(),
      region_type
    );
    return successResponse(res, 'Region added successfully', region, null, 201);
  } catch (error) {
    console.error('[CREATE REGION ERROR]', error);
    return internalErrorResponse(res, 'Gagal menambahkan region', error);
  }
};

export const updateRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const { region_name, region_type } = req.body;

    if (!region_name || !String(region_name).trim()) {
      return validationErrorResponse(res, ['Nama kecamatan wajib diisi']);
    }
    if (!VALID_REGION_TYPES.includes(region_type)) {
      return validationErrorResponse(res, [
        `Tipe wilayah harus salah satu dari: ${VALID_REGION_TYPES.join(', ')}`,
      ]);
    }

    const region = await RegionService.updateRegion(
      req,
      id,
      String(region_name).trim(),
      region_type
    );
    return successResponse(res, 'Region updated successfully', region, null, 200);
  } catch (error) {
    console.error('[UPDATE REGION ERROR]', error);
    if (error.message === 'Region not found') {
      return notFoundErrorResponse(res, 'Region');
    }
    return internalErrorResponse(res, 'Gagal memperbarui region', error);
  }
};

export const deleteRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await RegionService.deleteRegion(req, id);
    return successResponse(res, result.message, { id }, null, 200);
  } catch (error) {
    console.error('[DELETE REGION ERROR]', error);
    if (error.message === 'Region not found') {
      return notFoundErrorResponse(res, 'Region');
    }
    if (error.message.includes('masih punya')) {
      return conflictErrorResponse(res, error.message);
    }
    return internalErrorResponse(res, 'Gagal menghapus region', error);
  }
};

export const getAllSubRegions = async (req, res) => {
  try {
    const results = await RegionModel.getAllSubRegions();
    return successResponse(res, 'Sub-regions retrieved successfully', results, null, 200);
  } catch (error) {
    console.error('[GET ALL SUB REGIONS ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data sub-region', error);
  }
};

export const createSubRegion = async (req, res) => {
  try {
    const { region_id, sub_region_name } = req.body;

    const regionId = parseInt(region_id);
    if (!region_id || isNaN(regionId)) {
      return validationErrorResponse(res, ['Kecamatan wajib dipilih']);
    }
    if (!sub_region_name || !String(sub_region_name).trim()) {
      return validationErrorResponse(res, ['Nama sub-wilayah wajib diisi']);
    }

    const subRegion = await RegionService.createSubRegion(
      req,
      regionId,
      String(sub_region_name).trim()
    );
    return successResponse(res, 'Sub-region added successfully', subRegion, null, 201);
  } catch (error) {
    console.error('[CREATE SUB REGION ERROR]', error);
    if (error.message === 'Region not found') {
      return notFoundErrorResponse(res, 'Region');
    }
    return internalErrorResponse(res, 'Gagal menambahkan sub-region', error);
  }
};

export const updateSubRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const { region_id, sub_region_name } = req.body;

    const regionId = parseInt(region_id);
    if (!region_id || isNaN(regionId)) {
      return validationErrorResponse(res, ['Kecamatan wajib dipilih']);
    }
    if (!sub_region_name || !String(sub_region_name).trim()) {
      return validationErrorResponse(res, ['Nama sub-wilayah wajib diisi']);
    }

    const subRegion = await RegionService.updateSubRegion(
      req,
      id,
      regionId,
      String(sub_region_name).trim()
    );
    return successResponse(res, 'Sub-region updated successfully', subRegion, null, 200);
  } catch (error) {
    console.error('[UPDATE SUB REGION ERROR]', error);
    if (error.message === 'Sub-region not found') {
      return notFoundErrorResponse(res, 'Sub-region');
    }
    if (error.message === 'Region not found') {
      return notFoundErrorResponse(res, 'Region');
    }
    return internalErrorResponse(res, 'Gagal memperbarui sub-region', error);
  }
};

export const deleteSubRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await RegionService.deleteSubRegion(req, id);
    return successResponse(res, result.message, { id }, null, 200);
  } catch (error) {
    console.error('[DELETE SUB REGION ERROR]', error);
    if (error.message === 'Sub-region not found') {
      return notFoundErrorResponse(res, 'Sub-region');
    }
    if (error.message.includes('masih dipakai')) {
      return conflictErrorResponse(res, error.message);
    }
    return internalErrorResponse(res, 'Gagal menghapus sub-region', error);
  }
};
