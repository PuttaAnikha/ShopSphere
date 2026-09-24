const Dispute = require('../models/Dispute');
const Order = require('../models/Order');
const Seller = require('../models/Seller');
const notificationService = require('../services/notificationService');
const { logAudit } = require('../utils/auditLogger');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');

const createDispute = async (req, res, next) => {
  try {
    const { orderId, sellerId, reason, description, evidence = [] } = req.body;
    if (!orderId || !reason || !description) {
      return errorResponse(res, 400, 'Order ID, reason, and description are required');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 404, 'Order not found');
    }

    let targetSellerId = sellerId;
    if (!targetSellerId) {
      // Pick first seller from order if not specified
      if (order.items && order.items.length > 0) {
        targetSellerId = order.items[0].sellerId;
      } else {
        return errorResponse(res, 400, 'Seller ID is required');
      }
    }

    const raisedBy = req.user.role === 'SELLER' ? 'SELLER' : 'CUSTOMER';

    const dispute = await Dispute.create({
      orderId,
      customerId: order.customerId,
      sellerId: targetSellerId,
      raisedBy,
      reason,
      description,
      evidence: Array.isArray(evidence) ? evidence : [evidence],
      status: 'OPEN'
    });

    // Notify admins of new dispute
    await notificationService.notifyAdmins({
      title: 'New Dispute Raised',
      message: `A dispute has been raised for order ${order.orderNumber}. Reason: ${reason}`,
      type: 'DISPUTE_RAISED',
      relatedEntity: 'Dispute',
      relatedEntityId: dispute._id
    });

    // Notify seller
    const seller = await Seller.findById(targetSellerId);
    if (seller) {
      await notificationService.send({
        userId: seller.userId,
        title: 'Dispute Filed',
        message: `A dispute was filed against your order item (${order.orderNumber}).`,
        type: 'DISPUTE_RAISED',
        relatedEntity: 'Dispute',
        relatedEntityId: dispute._id
      });
    }

    return successResponse(res, 201, 'Dispute filed successfully', { dispute });
  } catch (error) {
    next(error);
  }
};

const getDisputes = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    if (req.user.role === 'CUSTOMER') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'SELLER') {
      const seller = await Seller.findOne({ userId: req.user._id });
      if (!seller) {
        return successResponse(res, 200, 'Disputes retrieved', {
          items: [],
          pagination: { total: 0, page, limit, totalPages: 1 }
        });
      }
      query.sellerId = seller._id;
    }

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate('customerId', 'name email')
        .populate('sellerId', 'storeName')
        .populate('orderId', 'orderNumber totalAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Dispute.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Disputes retrieved successfully',
      formatPaginatedResponse(disputes, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('sellerId', 'storeName phone')
      .populate('orderId')
      .populate('resolvedBy', 'name role');

    if (!dispute) {
      return errorResponse(res, 404, 'Dispute not found');
    }

    // Role checks
    if (req.user.role === 'CUSTOMER' && dispute.customerId._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Forbidden: You can only view your own disputes');
    }

    if (req.user.role === 'SELLER') {
      const seller = await Seller.findOne({ userId: req.user._id });
      if (!seller || dispute.sellerId._id.toString() !== seller._id.toString()) {
        return errorResponse(res, 403, 'Forbidden: Unauthorized');
      }
    }

    return successResponse(res, 200, 'Dispute retrieved successfully', { dispute });
  } catch (error) {
    next(error);
  }
};

const resolveDispute = async (req, res, next) => {
  try {
    const { status, resolution } = req.body;
    if (!['RESOLVED', 'REJECTED', 'CLOSED', 'UNDER_REVIEW'].includes(status)) {
      return errorResponse(res, 400, 'Invalid dispute resolution status');
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return errorResponse(res, 404, 'Dispute not found');
    }

    dispute.status = status;
    if (resolution) dispute.resolution = resolution;
    if (['RESOLVED', 'REJECTED', 'CLOSED'].includes(status)) {
      dispute.resolvedBy = req.user._id;
      dispute.resolvedAt = new Date();
    }

    await dispute.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'DISPUTE_RESOLVED',
      entityType: 'Dispute',
      entityId: dispute._id,
      newValue: { status, resolution }
    });

    // Notify customer
    await notificationService.send({
      userId: dispute.customerId,
      title: 'Dispute Update',
      message: `Your dispute for order #${dispute.orderId} is now ${status}. Resolution: ${resolution || 'N/A'}`,
      type: 'DISPUTE_UPDATED',
      relatedEntity: 'Dispute',
      relatedEntityId: dispute._id
    });

    return successResponse(res, 200, 'Dispute updated successfully', { dispute });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDispute,
  getDisputes,
  getDisputeById,
  resolveDispute
};
