const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/reports', adminController.getReports);
router.get('/reviews', adminController.getReviews);
router.get('/sellers', adminController.getSellers);
router.put('/sellers/:id/status', adminController.updateSellerStatus);
router.put('/products/:id/status', adminController.updateProductStatus);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
