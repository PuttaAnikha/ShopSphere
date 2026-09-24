const Seller = require('../models/Seller');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Permitted roles (ADMIN, SELLER, CUSTOMER, SUPPORT_AGENT, DELIVERY_PARTNER)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized: user context missing');
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

/**
 * Check if the authenticated seller is APPROVED by Admin
 */
const requireApprovedSeller = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      // Find an admin seller profile or attach first approved seller for product creation if needed
      let seller = await Seller.findOne({ userId: req.user._id });
      if (!seller) {
        seller = await Seller.findOne({ approvalStatus: 'APPROVED' });
      }
      req.seller = seller;
      return next();
    }

    if (req.user.role !== 'SELLER') {
      return errorResponse(res, 403, 'Forbidden: Only sellers can access this resource');
    }

    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, 404, 'Seller profile not found for this account');
    }

    if (seller.approvalStatus !== 'APPROVED') {
      return errorResponse(
        res,
        403,
        `Seller account is not approved. Current status: ${seller.approvalStatus}`
      );
    }

    req.seller = seller;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Attaches seller profile to req.seller if user is SELLER, without requiring APPROVED status
 */
const attachSellerProfile = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'SELLER') {
      const seller = await Seller.findOne({ userId: req.user._id });
      req.seller = seller;
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authorize,
  requireApprovedSeller,
  attachSellerProfile
};
