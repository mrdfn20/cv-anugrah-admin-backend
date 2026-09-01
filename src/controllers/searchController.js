// controllers/searchController.js
import SearchService from '../services/searchService.js';
import {
  successResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '../helpers/responseHelper.js';

const search = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return validationErrorResponse(res, ['Query parameter `q` is required']);
  }

  try {
    const results = await SearchService.globalSearch(q.trim());

    return successResponse(
      res,
      'Search results fetched successfully',
      results,
      null,
      200
    );
  } catch (error) {
    console.error('[SEARCH ERROR]', error);
    return internalErrorResponse(res, 'Gagal melakukan pencarian', error);
  }
};

export default { search };
