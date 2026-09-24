/**
 * Standard API Response utilities for ShopSphere
 */

const successResponse = (res, statusCode = 200, message = 'Success', data = {}, meta = undefined) => {
  const payload = {
    success: true,
    message,
    data
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

module.exports = {
  successResponse,
  errorResponse
};
