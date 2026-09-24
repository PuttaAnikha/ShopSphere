const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { authenticate, authenticateOptional } = require('../middleware/authMiddleware');
const { authorize, requireApprovedSeller } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createProductValidator,
  updateProductValidator
} = require('../validators/productValidator');

// Public product routes
router.get('/', authenticateOptional, productController.getProducts);
router.get('/:id', authenticateOptional, productController.getProductById);
router.get('/:id/reviews', reviewController.getProductReviews);

// Protected seller & admin product routes
router.post(
  '/',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  requireApprovedSeller,
  upload.array('images', 5),
  createProductValidator,
  validate,
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  updateProductValidator,
  validate,
  productController.updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  productController.deleteProduct
);

module.exports = router;
