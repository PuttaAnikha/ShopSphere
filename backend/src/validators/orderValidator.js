const { body } = require('express-validator');

const createOrderValidator = [
  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isObject()
    .withMessage('Shipping address must be an object'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),
  body('shippingAddress.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  body('items.*.productId')
    .optional()
    .isMongoId()
    .withMessage('Invalid productId format'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Item quantity must be at least 1'),
  body('paymentMethod')
    .optional()
    .isIn(['ONLINE_DEMO', 'CASH_ON_DELIVERY', 'MOCK_GATEWAY'])
    .withMessage('Payment method must be ONLINE_DEMO or CASH_ON_DELIVERY')
];

module.exports = {
  createOrderValidator
};
