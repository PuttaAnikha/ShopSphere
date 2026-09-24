const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'ORDER_PLACED',
        'ORDER_CONFIRMED',
        'ORDER_PACKED',
        'ORDER_SHIPPED',
        'ORDER_DELIVERED',
        'ORDER_CANCELLED',
        'RETURN_REQUESTED',
        'RETURN_UPDATED',
        'REFUND_PROCESSED',
        'SELLER_APPROVED',
        'SELLER_REJECTED',
        'PRODUCT_MODERATED',
        'LOW_STOCK',
        'DISPUTE_RAISED',
        'DISPUTE_UPDATED',
        'SUPPORT_TICKET_UPDATED',
        'GENERAL'
      ],
      default: 'GENERAL'
    },
    relatedEntity: {
      type: String,
      enum: ['Order', 'Product', 'Seller', 'Dispute', 'SupportTicket', 'Refund', 'User', 'System'],
      default: 'System'
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
