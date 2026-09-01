import ArmadaService from '../services/armadaService.js';
import {
  successResponse,
  validationErrorResponse,
  notFoundErrorResponse,
  conflictErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

export const getAllArmadas = async (req, res) => {
  try {
    const results = await ArmadaService.getAll();
    return successResponse(res, 'Armadas retrieved successfully', results, null, 200);
  } catch (error) {
    console.error('[GET ALL ARMADAS ERROR]', error);
    return internalErrorResponse(res, 'Gagal mengambil data armada', error);
  }
};

export const createArmada = async (req, res) => {
  try {
    const { armada_name } = req.body;

    if (!armada_name || !armada_name.trim()) {
      return validationErrorResponse(res, ['Nama armada wajib diisi']);
    }

    const armada = await ArmadaService.create(armada_name.trim());
    return successResponse(res, 'Armada added successfully', armada, null, 201);
  } catch (error) {
    console.error('[CREATE ARMADA ERROR]', error);
    return internalErrorResponse(res, 'Gagal menambahkan armada', error);
  }
};

export const updateArmada = async (req, res) => {
  try {
    const { id } = req.params;
    const { armada_name } = req.body;

    if (!armada_name || !armada_name.trim()) {
      return validationErrorResponse(res, ['Nama armada wajib diisi']);
    }

    const armada = await ArmadaService.update(id, armada_name.trim());
    return successResponse(res, 'Armada updated successfully', armada, null, 200);
  } catch (error) {
    console.error('[UPDATE ARMADA ERROR]', error);

    if (error.message === 'Armada not found') {
      return notFoundErrorResponse(res, 'Armada');
    }

    return internalErrorResponse(res, 'Gagal memperbarui armada', error);
  }
};

export const deleteArmada = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await ArmadaService.delete(id);
    return successResponse(res, result.message, { id }, null, 200);
  } catch (error) {
    console.error('[DELETE ARMADA ERROR]', error);

    if (error.message === 'Armada not found') {
      return notFoundErrorResponse(res, 'Armada');
    }

    if (error.message.includes('masih dipakai')) {
      return conflictErrorResponse(res, error.message);
    }

    return internalErrorResponse(res, 'Gagal menghapus armada', error);
  }
};

export default { getAllArmadas, createArmada, updateArmada, deleteArmada };
