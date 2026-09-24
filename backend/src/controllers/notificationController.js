const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');

const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { unreadOnly } = req.query;

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user._id, read: false })
    ]);

    const formatted = formatPaginatedResponse(notifications, total, page, limit);
    formatted.unreadCount = unreadCount;

    return successResponse(res, 200, 'Notifications retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, userId: req.user._id });
    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }

    notification.read = true;
    await notification.save();

    return successResponse(res, 200, 'Notification marked as read', { notification });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    return successResponse(res, 200, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
