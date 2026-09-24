const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { couponValidator } = require('../validators/couponValidator');

// Public/Customer coupon validation
router.post('/validate', authenticate, couponController.validateCoupon);

// Admin-only coupon management
router.post('/', authenticate, authorize('ADMIN'), couponValidator, validate, couponController.createCoupon);
router.get('/', authenticate, authorize('ADMIN'), couponController.getCoupons);
router.get('/:id', authenticate, authorize('ADMIN'), couponController.getCouponById);
router.put('/:id', authenticate, authorize('ADMIN'), couponController.updateCoupon);
router.delete('/:id', authenticate, authorize('ADMIN'), couponController.deleteCoupon);

module.exports = router;
