const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/orders', authorize('DELIVERY_PARTNER', 'ADMIN'), deliveryController.getAssignedDeliveries);
router.get('/orders/:id', authorize('DELIVERY_PARTNER', 'ADMIN'), deliveryController.getDeliveryById);
router.put('/orders/:id/status', authorize('DELIVERY_PARTNER', 'ADMIN'), deliveryController.updateDeliveryStatus);
router.post('/assign', authorize('ADMIN'), deliveryController.assignDeliveryPartner);

module.exports = router;
