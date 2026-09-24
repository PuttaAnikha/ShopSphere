const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const notificationService = require('../services/notificationService');
const { logAudit } = require('../utils/auditLogger');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');

const getAssignedDeliveries = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;

    const query = {};
    if (req.user.role === 'DELIVERY_PARTNER') {
      query.deliveryPartnerId = req.user._id;
    }
    if (status) query.status = status;

    const [deliveries, total] = await Promise.all([
      Delivery.find(query)
        .populate('orderId')
        .populate('deliveryPartnerId', 'name phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Delivery.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Deliveries retrieved successfully',
      formatPaginatedResponse(deliveries, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('orderId')
      .populate('deliveryPartnerId', 'name phone email');

    if (!delivery) {
      return errorResponse(res, 404, 'Delivery record not found');
    }

    if (
      req.user.role === 'DELIVERY_PARTNER' &&
      delivery.deliveryPartnerId._id.toString() !== req.user._id.toString()
    ) {
      return errorResponse(res, 403, 'Forbidden: You can only view deliveries assigned to you');
    }

    return successResponse(res, 200, 'Delivery retrieved successfully', { delivery });
  } catch (error) {
    next(error);
  }
};

const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      return errorResponse(res, 400, 'Invalid delivery status');
    }

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return errorResponse(res, 404, 'Delivery record not found');
    }

    if (
      req.user.role === 'DELIVERY_PARTNER' &&
      delivery.deliveryPartnerId.toString() !== req.user._id.toString()
    ) {
      return errorResponse(res, 403, 'Forbidden: You can only update your own assigned deliveries');
    }

    delivery.status = status;
    if (notes) delivery.notes = notes;

    const now = new Date();
    if (status === 'PICKED_UP') delivery.pickedUpAt = now;
    else if (status === 'OUT_FOR_DELIVERY') delivery.outForDeliveryAt = now;
    else if (status === 'DELIVERED') delivery.deliveredAt = now;

    await delivery.save();

    // Sync corresponding order status
    const order = await Order.findById(delivery.orderId);
    if (order) {
      if (status === 'PICKED_UP' || status === 'OUT_FOR_DELIVERY') {
        order.orderStatus = 'SHIPPED';
        await order.save();
        await notificationService.notifyCustomerOrder(order.customerId, order, 'SHIPPED');
      } else if (status === 'DELIVERED') {
        order.orderStatus = 'DELIVERED';
        await order.save();
        await notificationService.notifyCustomerOrder(order.customerId, order, 'DELIVERED');
      }
    }

    return successResponse(res, 200, `Delivery status updated to ${status}`, { delivery });
  } catch (error) {
    next(error);
  }
};

const assignDeliveryPartner = async (req, res, next) => {
  try {
    const { orderId, deliveryPartnerId } = req.body;
    if (!orderId || !deliveryPartnerId) {
      return errorResponse(res, 400, 'Order ID and Delivery Partner ID are required');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 404, 'Order not found');
    }

    const trackingNumber = `TRK-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    let delivery = await Delivery.findOne({ orderId });
    if (delivery) {
      delivery.deliveryPartnerId = deliveryPartnerId;
      delivery.status = 'ASSIGNED';
      await delivery.save();
    } else {
      delivery = await Delivery.create({
        orderId,
        deliveryPartnerId,
        trackingNumber,
        status: 'ASSIGNED'
      });
    }

    // Notify delivery partner
    await notificationService.send({
      userId: deliveryPartnerId,
      title: 'New Delivery Assigned',
      message: `You have been assigned order ${order.orderNumber} for delivery.`,
      type: 'GENERAL',
      relatedEntity: 'Order',
      relatedEntityId: order._id
    });

    return successResponse(res, 200, 'Delivery partner assigned successfully', { delivery });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignedDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  assignDeliveryPartner
};
