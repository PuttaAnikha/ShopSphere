const orderService = require('../services/orderService');
const UserActivity = require('../models/UserActivity');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, couponCode, paymentMethod } = req.body;
    const order = await orderService.createOrder({
      customerId: req.user._id,
      items,
      shippingAddress,
      couponCode,
      paymentMethod
    });

    // Record user activity for recommendations
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        await UserActivity.create({
          userId: req.user._id,
          action: 'PURCHASE',
          productId: item.productId
        }).catch(() => {});
      }
    }

    return successResponse(res, 201, 'Order placed successfully', { order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await orderService.getOrders(req.user, { page, limit, status });
    return successResponse(res, 200, 'Orders retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);
    return successResponse(res, 200, 'Order retrieved successfully', { order });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return errorResponse(res, 400, 'New status is required');
    }

    const order = await orderService.updateOrderStatus(req.params.id, status, req.user);
    return successResponse(res, 200, `Order status updated to ${status}`, { order });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await orderService.cancelOrder(req.params.id, req.user._id, reason);
    return successResponse(res, 200, 'Order cancelled successfully', { order });
  } catch (error) {
    next(error);
  }
};

const returnOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await orderService.requestReturn(req.params.id, req.user._id, reason);
    return successResponse(res, 200, 'Return request submitted successfully', { order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  returnOrder
};
