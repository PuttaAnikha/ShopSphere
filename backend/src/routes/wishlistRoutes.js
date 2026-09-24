const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate, authorize('CUSTOMER'));

router.get('/', wishlistController.getWishlist);
router.post('/:productId', wishlistController.addToWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;
