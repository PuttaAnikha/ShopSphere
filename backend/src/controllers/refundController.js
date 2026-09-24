const Refund = require('../models/Refund');
const Order = require('../models/Order');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const { logAudit } = require('../utils/auditLogger');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');

const createRefund = async (req, res, next) => {
  try {
    const { orderId, amount, reason, sellerId } = req.body;
    if (!orderId || !amount || !reason) {
      return errorResponse(res, 400, 'Order ID, amount, and reason are required');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 404, 'Order not found');
    }

    if (amount > order.totalAmount) {
      return errorResponse(res, 400, 'Refund amount cannot exceed total order amount');
    }

    const refund = await Refund.create({
      orderId,
      customerId: order.customerId,
      sellerId: sellerId || (order.items[0] ? order.items[0].sellerId : null),
      amount: parseFloat(amount),
      reason,
      status: 'PENDING'
    });

    return successResponse(res, 201, 'Refund request created', { refund });
  } catch (error) {
    next(error);
  }
};

const getRefunds = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    if (req.user.role === 'CUSTOMER') {
      query.customerId = req.user._id;
    }

    const [refunds, total] = await Promise.all([
      Refund.find(query)
        .populate('orderId', 'orderNumber totalAmount')
        .populate('customerId', 'name email')
        .populate('sellerId', 'storeName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Refund.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Refunds retrieved successfully',
      formatPaginatedResponse(refunds, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const processRefundStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
      return errorResponse(res, 400, 'Invalid refund status');
    }

    const refund = await Refund.findById(id);
    if (!refund) {
      return errorResponse(res, 404, 'Refund not found');
    }

    const oldStatus = refund.status;
    refund.status = status;
    refund.processedBy = req.user._id;

    if (status === 'COMPLETED') {
      // Execute payment service refund abstraction
      const gatewayResult = await paymentService.processRefund({
        orderId: refund.orderId,
        amount: refund.amount,
        reason: refund.reason
      });
      refund.gatewayTransactionId = gatewayResult.refundId;
      refund.processedAt = new Date();

      // Update Order paymentStatus to REFUNDED if full refund
      const order = await Order.findById(refund.orderId);
      if (order) {
        order.paymentStatus = 'REFUNDED';
        order.orderStatus = 'REFUNDED';
        await order.save();
      }
    }

    await refund.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'REFUND_STATUS_UPDATE',
      entityType: 'Refund',
      entityId: refund._id,
      oldValue: { status: oldStatus },
      newValue: { status }
    });

    // Notify customer
    await notificationService.send({
      userId: refund.customerId,
      title: 'Refund Status Update',
      message: `Your refund of ₹${refund.amount} has been updated to ${status}.`,
      type: 'REFUND_PROCESSED',
      relatedEntity: 'Refund',
      relatedEntityId: refund._id
    });

    return successResponse(res, 200, `Refund status updated to ${status}`, { refund });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRefund,
  getRefunds,
  processRefundStatus
};
