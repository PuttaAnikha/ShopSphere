const { body } = require('express-validator');

const reviewValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid Product ID format'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters')
];

module.exports = {
  reviewValidator
};
