const authService = require('../services/authService');
const User = require('../models/User');
const Seller = require('../models/Seller');
const { successResponse } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, 201, 'Registration successful', result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // JWT is stateless; client removes token. We can optionally clear cookies or return success
    return successResponse(res, 200, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    let sellerProfile = null;
    if (req.user.role === 'SELLER') {
      sellerProfile = await Seller.findOne({ userId: req.user._id });
    }
    return successResponse(res, 200, 'Current user profile retrieved', {
      user: req.user,
      seller: sellerProfile
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (address) {
      user.address = {
        ...user.address.toObject(),
        ...address
      };
    }

    await user.save();
    return successResponse(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, currentPassword, newPassword);
    return successResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword
};
