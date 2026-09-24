const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.post('/', disputeController.createDispute);
router.get('/', disputeController.getDisputes);
router.get('/:id', disputeController.getDisputeById);
router.put('/:id/resolve', authorize('ADMIN', 'SUPPORT_AGENT'), disputeController.resolveDispute);

module.exports = router;
