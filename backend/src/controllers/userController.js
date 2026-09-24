const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');
const { logAudit } = require('../utils/auditLogger');

const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Users retrieved successfully',
      formatPaginatedResponse(users, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return errorResponse(res, 400, 'Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'USER_STATUS_UPDATE',
      entityType: 'User',
      entityId: user._id,
      oldValue: { status: oldStatus },
      newValue: { status }
    });

    return successResponse(res, 200, `User status updated to ${status}`, { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus
};
