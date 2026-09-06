import RegionModel from '../models/regionModel.js';
import { successResponse, internalErrorResponse } from '../helpers/responseHelper.js';

export const getAllRegions = async (req, res) => {
  try {
    const results = await RegionModel.getAllRegions();
    return successResponse(res, 'Regions retrieved successfully', results, null, 200);
  } catch (error) {
    console.error('[GET ALL REGIONS ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data region', error);
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
