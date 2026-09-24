const { body } = require('express-validator');

const createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid Category ID format'),
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100')
];

const updateProductValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Category ID format')
];

module.exports = {
  createProductValidator,
  updateProductValidator
};
