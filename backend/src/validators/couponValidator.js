const { body } = require('express-validator');

const couponValidator = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .toUpperCase(),
  body('discountType')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['PERCENTAGE', 'FIXED'])
    .withMessage('Discount type must be PERCENTAGE or FIXED'),
  body('discountValue')
    .notEmpty()
    .withMessage('Discount value is required')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minOrderAmount must be non-negative'),
  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry date must be a valid date (ISO8601)')
];

module.exports = {
  couponValidator
};
