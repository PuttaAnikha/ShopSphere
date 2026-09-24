const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.post('/', refundController.createRefund);
router.get('/', refundController.getRefunds);
router.put('/:id/status', authorize('ADMIN', 'SUPPORT_AGENT'), refundController.processRefundStatus);

module.exports = router;
