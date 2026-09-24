const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/', authorize('ADMIN'), settlementController.getAllSettlements);
router.get('/seller', authorize('SELLER'), settlementController.getSellerSettlements);
router.put('/:id/status', authorize('ADMIN'), settlementController.updateSettlementStatus);

module.exports = router;
