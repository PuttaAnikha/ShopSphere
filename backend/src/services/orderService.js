const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Settlement = require('../models/Settlement');
const inventoryService = require('./inventoryService');
const notificationService = require('./notificationService');
const { logAudit } = require('../utils/auditLogger');

// Permitted order transitions map
const VALID_TRANSITIONS = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: ['REFUNDED'],
  REFUNDED: []
};

class OrderService {
  /**
   * Helper to execute in session/transaction if replica set is supported
   */
  async withOptionalTransaction(workFn) {
    let session = null;
    let inTransaction = false;

    try {
      session = await mongoose.startSession();
      const hello = await mongoose.connection.db.admin().command({ hello: 1 });
      const supportsTransactions = Boolean(hello.setName || hello.msg === 'isdbgrid');

      if (supportsTransactions) {
        session.startTransaction();
        inTransaction = true;
      } else {
        // Local standalone MongoDB does not support transactions.
        inTransaction = false;
        await session.endSession();
        session = null;
      }

      const result = await workFn(session);

      if (inTransaction && session) {
        await session.commitTransaction();
      }
      return result;
    } catch (error) {
      if (inTransaction && session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  /**
   * Checkout & create multi-vendor order
   */
  async createOrder({ customerId, items = [], shippingAddress, couponCode = null, paymentMethod = 'MOCK_GATEWAY' }) {
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      const err = new Error('Complete shipping address is required');
      err.statusCode = 400;
      throw err;
    }

    // If items are not passed, load from Cart
    let checkoutItems = items;
    if (!checkoutItems || checkoutItems.length === 0) {
      const cart = await Cart.findOne({ userId: customerId });
      if (!cart || cart.items.length === 0) {
        const err = new Error('Cart is empty. Please add items before checking out.');
        err.statusCode = 400;
        throw err;
      }
      checkoutItems = cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity
      }));
    }

    const normalizedPaymentMethod = paymentMethod === 'MOCK_GATEWAY' ? 'ONLINE_DEMO' : paymentMethod;
    if (!['ONLINE_DEMO', 'CASH_ON_DELIVERY'].includes(normalizedPaymentMethod)) {
      const err = new Error('Invalid payment method');
      err.statusCode = 400;
      throw err;
    }

    const isOnlineDemo = normalizedPaymentMethod === 'ONLINE_DEMO';

    // Execute with transactional consistency
    return this.withOptionalTransaction(async (session) => {
      // 1. Verify products & stock from DB (never trust client prices)
      const verifiedProducts = await inventoryService.validateStock(checkoutItems);

      // 2. Decrement stock
      await inventoryService.decrementStock(checkoutItems, session);

      // 3. Calculate subtotal and build items list
      let subtotal = 0;
      const orderItems = [];
      const sellerItemGroups = {};

      for (const item of verifiedProducts) {
        const product = item.product;
        const quantity = item.requestedQuantity;
        // Apply product discount if applicable
        const effectivePrice = product.discount > 0
          ? Math.round(product.price * (1 - product.discount / 100))
          : product.price;

        const itemSubtotal = effectivePrice * quantity;
        subtotal += itemSubtotal;

        const sellerIdStr = product.sellerId.toString();
        if (!sellerItemGroups[sellerIdStr]) {
          sellerItemGroups[sellerIdStr] = [];
        }

        const itemData = {
          productId: product._id,
          sellerId: product.sellerId,
          productName: product.name,
          productImage: product.images && product.images[0] ? product.images[0] : '',
          quantity,
          priceAtPurchase: effectivePrice,
          subtotal: itemSubtotal,
          status: 'PLACED'
        };

        orderItems.push(itemData);
        sellerItemGroups[sellerIdStr].push(itemData);
      }

      // 4. Validate and apply coupon if provided
      let discountAmount = 0;
      let appliedCoupon = null;

      if (couponCode) {
        const coupon = await Coupon.findOne({
          code: couponCode.toUpperCase().trim(),
          active: true
        });

        if (coupon) {
          const now = new Date();
          if (coupon.startDate <= now && coupon.expiryDate >= now) {
            if (subtotal >= coupon.minOrderAmount) {
              if (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit) {
                if (coupon.discountType === 'PERCENTAGE') {
                  discountAmount = (subtotal * coupon.discountValue) / 100;
                  if (coupon.maxDiscount !== null && discountAmount > coupon.maxDiscount) {
                    discountAmount = coupon.maxDiscount;
                  }
                } else if (coupon.discountType === 'FIXED') {
                  discountAmount = coupon.discountValue;
                }

                discountAmount = Math.min(discountAmount, subtotal);
                appliedCoupon = coupon;

                // Increment coupon used count
                coupon.usedCount += 1;
                await coupon.save({ session: session || undefined });
              }
            }
          }
        }
      }

      const shippingAmount = subtotal > 1000 ? 0 : 50; // Free shipping over ₹1000
      const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount);

      // 5. Generate Master Order Number e.g. ORD-171829-1234
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const masterOrderNumber = `ORD-${Date.now().toString().slice(-6)}-${randomSuffix}`;

      // 6. Generate Seller Sub-Orders
      const sellerIds = Object.keys(sellerItemGroups);
      const sellerOrders = sellerIds.map((sellerId, idx) => {
        const letterCode = String.fromCharCode(65 + (idx % 26)); // A, B, C...
        const sellerSubtotal = sellerItemGroups[sellerId].reduce((acc, curr) => acc + curr.subtotal, 0);
        return {
          sellerId,
          sellerOrderNumber: `${masterOrderNumber}-${letterCode}`,
          subtotal: sellerSubtotal,
          shippingAmount: 0,
          status: 'PLACED'
        };
      });

      // 7. Create Master Order Document
      const orderDocs = await Order.create(
        [
          {
            customerId,
            orderNumber: masterOrderNumber,
            items: orderItems,
            sellerOrders,
            subtotal,
            discount: discountAmount,
            shippingAmount,
            totalAmount,
            couponId: appliedCoupon ? appliedCoupon._id : null,
            couponCode: appliedCoupon ? appliedCoupon.code : '',
            shippingAddress,
            paymentMethod: normalizedPaymentMethod,
            paymentStatus: isOnlineDemo ? 'SUCCESSFUL' : 'PENDING',
            paymentDetails: {
              transactionId: isOnlineDemo
                ? `DEMO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
                : '',
              paidAt: isOnlineDemo ? new Date() : null
            },
            orderStatus: 'PLACED'
          }
        ],
        { session: session || undefined }
      );

      const createdOrder = orderDocs[0];

      // 8. Create individual OrderItem documents linked to master order
      const orderItemDocs = orderItems.map((item) => ({
        ...item,
        orderId: createdOrder._id
      }));
      await OrderItem.insertMany(orderItemDocs, { session: session || undefined });

      // 9. Create Pending Settlements for each seller (e.g. 10% platform commission)
      for (const subOrder of sellerOrders) {
        const commission = Math.round(subOrder.subtotal * 0.10); // 10% platform commission
        const netAmount = subOrder.subtotal - commission;

        await Settlement.create(
          [
            {
              sellerId: subOrder.sellerId,
              orderId: createdOrder._id,
              grossAmount: subOrder.subtotal,
              platformCommission: commission,
              refundAdjustment: 0,
              netAmount,
              status: 'PENDING'
            }
          ],
          { session: session || undefined }
        );
      }

      // 10. Clear customer Cart
      await Cart.findOneAndUpdate({ userId: customerId }, { items: [] }, { session: session || undefined });

      // 11. Send Notifications
      await notificationService.notifyCustomerOrder(customerId, createdOrder, 'PLACED');

      for (const sellerSub of sellerOrders) {
        const seller = await Seller.findById(sellerSub.sellerId);
        if (seller) {
          await notificationService.notifySellerNewOrder(
            seller.userId,
            sellerSub.sellerOrderNumber,
            sellerItemGroups[sellerSub.sellerId.toString()].length,
            sellerSub.subtotal
          );
        }
      }

      return createdOrder;
    });
  }

  /**
   * Get single order by ID with strict data isolation
   */
  async getOrderById(orderId, user) {
    const order = await Order.findById(orderId).populate('customerId', 'name email phone');
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    // Role-based visibility
    if (user.role === 'ADMIN' || user.role === 'SUPPORT_AGENT') {
      return order;
    }

    if (user.role === 'CUSTOMER') {
      if (order.customerId._id.toString() !== user._id.toString()) {
        const err = new Error('Forbidden: You can only view your own orders');
        err.statusCode = 403;
        throw err;
      }
      return order;
    }

    if (user.role === 'SELLER') {
      const seller = await Seller.findOne({ userId: user._id });
      if (!seller) {
        const err = new Error('Seller profile not found');
        err.statusCode = 404;
        throw err;
      }

      const sellerIdStr = seller._id.toString();
      // Filter items so the seller only sees items containing their products
      const filteredItems = order.items.filter((item) => item.sellerId.toString() === sellerIdStr);
      if (filteredItems.length === 0) {
        const err = new Error('Forbidden: You are not authorized to view this order');
        err.statusCode = 403;
        throw err;
      }

      const filteredSubOrder = order.sellerOrders.find(
        (so) => so.sellerId.toString() === sellerIdStr
      );

      const isolatedOrder = order.toObject();
      isolatedOrder.items = filteredItems;
      isolatedOrder.sellerOrders = filteredSubOrder ? [filteredSubOrder] : [];
      // Do not expose other vendor subtotal or total figures
      isolatedOrder.subtotal = filteredSubOrder ? filteredSubOrder.subtotal : 0;
      isolatedOrder.totalAmount = filteredSubOrder ? filteredSubOrder.subtotal : 0;
      return isolatedOrder;
    }

    if (user.role === 'DELIVERY_PARTNER') {
      // Check if delivery assigned
      const Delivery = require('../models/Delivery');
      const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: user._id });
      if (!delivery) {
        const err = new Error('Forbidden: This order is not assigned to you');
        err.statusCode = 403;
        throw err;
      }
      return order;
    }

    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }

  /**
   * Get paginated orders list with role-based filtering
   */
  async getOrders(user, { page = 1, limit = 10, status = null } = {}) {
    const query = {};
    if (status) query.orderStatus = status;

    if (user.role === 'CUSTOMER') {
      query.customerId = user._id;
    } else if (user.role === 'SELLER') {
      const seller = await Seller.findOne({ userId: user._id });
      if (!seller) {
        return { items: [], pagination: { total: 0, page, limit, totalPages: 1 } };
      }
      query['items.sellerId'] = seller._id;
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('customerId', 'name email'),
      Order.countDocuments(query)
    ]);

    // If seller, isolate and mask other sellers' items from the returned list
    let sanitizedOrders = orders;
    if (user.role === 'SELLER') {
      const seller = await Seller.findOne({ userId: user._id });
      const sellerIdStr = seller._id.toString();

      sanitizedOrders = orders.map((order) => {
        const obj = order.toObject();
        obj.items = obj.items.filter((item) => item.sellerId.toString() === sellerIdStr);
        const sub = obj.sellerOrders.find((so) => so.sellerId.toString() === sellerIdStr);
        obj.sellerOrders = sub ? [sub] : [];
        if (sub) {
          obj.subtotal = sub.subtotal;
          obj.totalAmount = sub.subtotal;
        }
        return obj;
      });
    }

    return {
      items: sanitizedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Update order status with strict lifecycle transition checks
   */
  async updateOrderStatus(orderId, newStatus, user) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    const currentStatus = order.orderStatus;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      const err = new Error(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed: [${allowed.join(', ')}]`
      );
      err.statusCode = 400;
      throw err;
    }

    // Role verification
    if (user.role === 'SELLER') {
      const seller = await Seller.findOne({ userId: user._id });
      if (!seller) {
        const err = new Error('Seller profile not found');
        err.statusCode = 404;
        throw err;
      }
      // Check seller owns items in this order
      const hasSellerItems = order.items.some(
        (i) => i.sellerId.toString() === seller._id.toString()
      );
      if (!hasSellerItems) {
        const err = new Error('Unauthorized to update this order');
        err.statusCode = 403;
        throw err;
      }

      // Update seller's sub-order status
      const subOrder = order.sellerOrders.find(
        (so) => so.sellerId.toString() === seller._id.toString()
      );
      if (subOrder) {
        subOrder.status = newStatus;
      }

      // Update items status for this seller
      order.items.forEach((item) => {
        if (item.sellerId.toString() === seller._id.toString()) {
          item.status = newStatus;
        }
      });
    }

    // Update master order status
    order.orderStatus = newStatus;
    if (newStatus === 'CANCELLED') {
      order.cancelledAt = new Date();
    } else if (newStatus === 'RETURNED') {
      order.returnedAt = new Date();
    }

    await order.save();

    // Audit log
    await logAudit({
      userId: user._id,
      role: user.role,
      action: 'ORDER_STATUS_UPDATE',
      entityType: 'Order',
      entityId: order._id,
      oldValue: { orderStatus: currentStatus },
      newValue: { orderStatus: newStatus }
    });

    // Notify customer
    await notificationService.notifyCustomerOrder(order.customerId, order, newStatus);

    return order;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, userId, reason) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    if (order.customerId.toString() !== userId.toString()) {
      const err = new Error('Unauthorized to cancel this order');
      err.statusCode = 403;
      throw err;
    }

    if (!['PLACED', 'CONFIRMED'].includes(order.orderStatus)) {
      const err = new Error(`Order cannot be cancelled in status "${order.orderStatus}"`);
      err.statusCode = 400;
      throw err;
    }

    order.orderStatus = 'CANCELLED';
    order.cancellationReason = reason || 'Customer requested cancellation';
    order.cancelledAt = new Date();

    order.items.forEach((i) => {
      i.status = 'CANCELLED';
    });
    order.sellerOrders.forEach((so) => {
      so.status = 'CANCELLED';
    });

    await order.save();

    // Restore stock
    await inventoryService.restoreStock(order.items);

    await logAudit({
      userId,
      role: 'CUSTOMER',
      action: 'ORDER_CANCELLED',
      entityType: 'Order',
      entityId: order._id,
      newValue: { reason }
    });

    await notificationService.notifyCustomerOrder(order.customerId, order, 'CANCELLED');

    return order;
  }

  /**
   * Return order request
   */
  async requestReturn(orderId, userId, reason) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    if (order.customerId.toString() !== userId.toString()) {
      const err = new Error('Unauthorized to request return for this order');
      err.statusCode = 403;
      throw err;
    }

    if (order.orderStatus !== 'DELIVERED') {
      const err = new Error('Return request can only be submitted for delivered orders');
      err.statusCode = 400;
      throw err;
    }

    order.orderStatus = 'RETURNED';
    order.returnReason = reason || 'Customer requested return';
    order.returnedAt = new Date();
    await order.save();

    await logAudit({
      userId,
      role: 'CUSTOMER',
      action: 'ORDER_RETURN_REQUESTED',
      entityType: 'Order',
      entityId: order._id,
      newValue: { reason }
    });

    await notificationService.notifyCustomerOrder(order.customerId, order, 'RETURNED');

    return order;
  }
}

module.exports = new OrderService();
