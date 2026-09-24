const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All seller endpoints require SELLER role
router.use(authenticate, authorize('SELLER'));

router.get('/profile', sellerController.getProfile);
router.put('/profile', sellerController.updateProfile);
router.get('/inventory', sellerController.getInventory);
router.get('/dashboard', sellerController.getDashboard);
router.get('/analytics', sellerController.getAnalytics);
router.get('/revenue', sellerController.getRevenue);
router.get('/orders/statistics', sellerController.getOrderStatistics);
router.get('/products', productController.getSellerProducts);

module.exports = router;
