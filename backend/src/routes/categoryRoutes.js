const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public category routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin-only category management routes
router.post('/', authenticate, authorize('ADMIN'), categoryController.createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), categoryController.deleteCategory);

module.exports = router;
