const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItemToCart);
router.put('/items/:itemId', cartController.updateCartItemQuantity);
router.delete('/items/:itemId', cartController.removeCartItem);
router.delete('/clear', cartController.clearCart);

module.exports = router;
