const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Protect routes: checks JWT token, user existence, and ACTIVE status
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Authentication token missing or not provided');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return errorResponse(res, 401, 'Invalid or expired authentication token');
    }

    const user = await User.findById(decoded.id || decoded._id);
    if (!user) {
      return errorResponse(res, 401, 'User associated with token no longer exists');
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 403, `Account access denied: status is ${user.status}`);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication: attaches user if token is provided and valid, otherwise proceeds as guest
 */
const authenticateOptional = async (req, res, next) => {
  try {
    let token = null;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id || decoded._id);
      if (user && user.status === 'ACTIVE') {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (e) {
      req.user = null;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authenticateOptional
};
