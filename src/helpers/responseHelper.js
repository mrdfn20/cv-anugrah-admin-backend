// utils/responseHelper.js

/**
 * Success Response Helper
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Response data (can be array, object, or primitive)
 * @param {Object} meta - Additional metadata (pagination, filters, etc)
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const successResponse = (
  res,
  message,
  data = null,
  meta = null,
  statusCode = 200
) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Generic Error Response Helper
 * @param {Object} res - Express response object
 * @param {string} message - Error message for user
 * @param {Object} error - Error details/code
 * @param {number} statusCode - HTTP status code (default: 400)
 */
export const errorResponse = (res, message, error = null, statusCode = 400) => {
  const response = {
    success: false,
    message,
  };

  if (error) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation Error Response (400)
 * @param {Object} res - Express response object
 * @param {string|Array} validationErrors - Validation error details
 */
export const validationErrorResponse = (res, validationErrors) => {
  const errorDetails = Array.isArray(validationErrors)
    ? validationErrors
    : [validationErrors];

  return res.status(400).json({
    success: false,
    message: 'Data tidak valid',
    error: {
      code: 'VALIDATION_ERROR',
      details: errorDetails,
    },
  });
};

/**
 * Authentication Error Response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Custom auth error message
 */
export const authErrorResponse = (
  res,
  message = 'Silakan login terlebih dahulu'
) => {
  return res.status(401).json({
    success: false,
    message,
    error: {
      code: 'UNAUTHORIZED',
      details: 'Token tidak valid atau sudah expired',
    },
  });
};

/**
 * Authorization Error Response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Custom authorization error message
 */
export const forbiddenErrorResponse = (
  res,
  message = 'Anda tidak memiliki izin untuk mengakses resource ini'
) => {
  return res.status(403).json({
    success: false,
    message,
    error: {
      code: 'FORBIDDEN',
      details: 'Role atau permission tidak mencukupi',
    },
  });
};

/**
 * Not Found Error Response (404)
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name that was not found
 */
export const notFoundErrorResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} tidak ditemukan`,
    error: {
      code: 'NOT_FOUND',
      details: `${resource} tidak ada atau sudah dihapus`,
    },
  });
};

/**
 * Conflict Error Response (409)
 * @param {Object} res - Express response object
 * @param {string} message - Conflict error message
 */
export const conflictErrorResponse = (res, message = 'Data sudah ada') => {
  return res.status(409).json({
    success: false,
    message,
    error: {
      code: 'CONFLICT',
      details: 'Resource sudah exists atau dalam keadaan conflict',
    },
  });
};

/**
 * Internal Server Error Response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message for user
 * @param {*} errorDetails - Technical error details (should be logged, not exposed to user)
 */
export const internalErrorResponse = (
  res,
  message = 'Terjadi kesalahan pada server',
  errorDetails = null
) => {
  // Log error details for debugging (don't expose to user)
  if (errorDetails) {
    console.error('[INTERNAL ERROR]', errorDetails);
  }

  return res.status(500).json({
    success: false,
    message,
    error: {
      code: 'INTERNAL_ERROR',
      details: 'Silakan coba lagi atau hubungi administrator',
    },
  });
};

/**
 * Database Error Response (500)
 * @param {Object} res - Express response object
 * @param {*} dbError - Database error object
 */
export const databaseErrorResponse = (res, dbError) => {
  // Log database error for debugging
  console.error('[DATABASE ERROR]', dbError);

  return res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada database',
    error: {
      code: 'DATABASE_ERROR',
      details: 'Database tidak dapat diakses atau query bermasalah',
    },
  });
};

/**
 * Pagination Meta Helper
 * @param {number} total - Total items in database
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {Object} filters - Applied filters
 */
export const createPaginationMeta = (total, page, limit, filters = {}) => {
  const totalPages = Math.ceil(total / limit);

  return {
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    ...(Object.keys(filters).length > 0 && { filters }),
  };
};

/**
 * Express Error Handler Middleware
 * Catches all unhandled errors and returns consistent error response
 */
export const globalErrorHandler = (err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);

  // Check if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return authErrorResponse(res, 'Token tidak valid');
  }

  if (err.name === 'TokenExpiredError') {
    return authErrorResponse(res, 'Token sudah expired');
  }

  // Joi validation errors
  if (err.details && Array.isArray(err.details)) {
    const validationErrors = err.details.map((detail) => detail.message);
    return validationErrorResponse(res, validationErrors);
  }

  // MySQL/Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return conflictErrorResponse(res, 'Data sudah ada');
  }

  if (err.code && err.code.startsWith('ER_')) {
    return databaseErrorResponse(res, err);
  }

  // Default internal server error
  return internalErrorResponse(
    res,
    'Terjadi kesalahan yang tidak terduga',
    err
  );
};
