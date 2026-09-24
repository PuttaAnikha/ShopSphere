const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  /**
   * Send notification to a specific user
   */
  async send({ userId, title, message, type = 'GENERAL', relatedEntity = 'System', relatedEntityId = null }) {
    try {
      return await Notification.create({
        userId,
        title,
        message,
        type,
        relatedEntity,
        relatedEntityId
      });
    } catch (error) {
      console.error('[NotificationService Error]:', error.message);
      return null;
    }
  }

  /**
   * Broadcast notification to all admins
   */
  async notifyAdmins({ title, message, type = 'GENERAL', relatedEntity = 'System', relatedEntityId = null }) {
    try {
      const admins = await User.find({ role: 'ADMIN', status: 'ACTIVE' }).select('_id');
      const notifications = admins.map((admin) => ({
        userId: admin._id,
        title,
        message,
        type,
        relatedEntity,
        relatedEntityId
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (error) {
      console.error('[NotificationService notifyAdmins Error]:', error.message);
    }
  }

  /**
   * Notify customer on order events
   */
  async notifyCustomerOrder(customerId, order, status) {
    const statusTitles = {
      PLACED: 'Order Placed Successfully',
      CONFIRMED: 'Order Confirmed',
      PACKED: 'Order Packed',
      SHIPPED: 'Order Dispatched',
      DELIVERED: 'Order Delivered',
      CANCELLED: 'Order Cancelled',
      RETURNED: 'Order Returned',
      REFUNDED: 'Order Refunded'
    };

    const title = statusTitles[status] || `Order Update: ${status}`;
    const message = `Your order ${order.orderNumber} is now ${status.toLowerCase()}.`;

    return this.send({
      userId: customerId,
      title,
      message,
      type: `ORDER_${status}`,
      relatedEntity: 'Order',
      relatedEntityId: order._id
    });
  }

  /**
   * Notify seller of new order items
   */
  async notifySellerNewOrder(sellerUserId, orderNumber, itemCount, subtotal) {
    return this.send({
      userId: sellerUserId,
      title: 'New Order Received',
      message: `You have received a new order (${orderNumber}) with ${itemCount} item(s) totaling ₹${subtotal}.`,
      type: 'ORDER_PLACED',
      relatedEntity: 'Order'
    });
  }
}

module.exports = new NotificationService();
