const User = require('../models/User');
const Seller = require('../models/Seller');
const { generateToken } = require('../utils/generateToken');
const notificationService = require('./notificationService');

class AuthService {
  /**
   * Register a new user (CUSTOMER or SELLER)
   * Prevents registering as ADMIN, SUPPORT_AGENT, or DELIVERY_PARTNER publicly
   */
  async register({ name, email, password, phone, role = 'CUSTOMER', storeName, storeDescription, address }) {
    // Prevent public creation of privileged roles
    const allowedPublicRoles = ['CUSTOMER', 'SELLER'];
    if (!allowedPublicRoles.includes(role)) {
      throw new Error(`Public registration as role '${role}' is not allowed`);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const err = new Error('Email is already registered');
      err.statusCode = 409;
      throw err;
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role,
      status: 'ACTIVE',
      address
    });

    let sellerProfile = null;

    // If role is SELLER, create Seller profile with PENDING approval status
    if (role === 'SELLER') {
      if (!storeName) {
        // Rollback user creation
        await User.findByIdAndDelete(user._id);
        throw new Error('Store name is required for seller registration');
      }

      sellerProfile = await Seller.create({
        userId: user._id,
        storeName,
        description: storeDescription || '',
        phone: phone || '',
        address: address || {},
        approvalStatus: 'PENDING'
      });

      // Alert admins of new seller application
      await notificationService.notifyAdmins({
        title: 'New Seller Registration',
        message: `Seller "${storeName}" (${user.email}) registered and is awaiting approval.`,
        type: 'SELLER_APPROVED',
        relatedEntity: 'Seller',
        relatedEntityId: sellerProfile._id
      });
    }

    const token = generateToken({ id: user._id, role: user.role });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        address: user.address,
        createdAt: user.createdAt
      },
      seller: sellerProfile,
      token
    };
  }

  /**
   * Login user
   */
  async login({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    if (user.status !== 'ACTIVE') {
      const err = new Error(`Account access denied: status is ${user.status}`);
      err.statusCode = 403;
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    let seller = null;
    if (user.role === 'SELLER') {
      seller = await Seller.findOne({ userId: user._id });
    }

    const token = generateToken({ id: user._id, role: user.role });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        address: user.address,
        createdAt: user.createdAt
      },
      seller,
      token
    };
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const err = new Error('Current password is incorrect');
      err.statusCode = 400;
      throw err;
    }

    user.password = newPassword;
    await user.save();
    return true;
  }
}

module.exports = new AuthService();
