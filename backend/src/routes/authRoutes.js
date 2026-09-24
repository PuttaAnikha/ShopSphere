const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  registerValidator,
  loginValidator,
  changePasswordValidator
} = require('../validators/authValidator');

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, changePasswordValidator, validate, authController.changePassword);

module.exports = router;
