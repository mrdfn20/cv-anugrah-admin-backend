export const successResponse = (
  res,
  message,
  data = null,
  statusCode = 200
) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

export const errorResponse = (res, error, statusCode = 500) => {
  return res.status(statusCode).json({
    status: 'error',
    message: error.message || 'Internal Server Error',
    error,
  });
};

export const validationErrorResponse = (res, validationMessage) => {
  return res.status(400).json({
    status: 'fail',
    message: validationMessage,
  });
};
