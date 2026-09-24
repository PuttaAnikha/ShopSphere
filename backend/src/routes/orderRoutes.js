const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createOrderValidator } = require('../validators/orderValidator');

router.use(authenticate);

router.post('/', createOrderValidator, validate, orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
router.post('/:id/cancel', orderController.cancelOrder);
router.post('/:id/return', orderController.returnOrder);

module.exports = router;
