const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', authenticate, authorize('ADMIN'), userController.getAllUsers);
router.get('/:id', authenticate, authorize('ADMIN'), userController.getUserById);
router.put('/:id/status', authenticate, authorize('ADMIN'), userController.updateUserStatus);

module.exports = router;
