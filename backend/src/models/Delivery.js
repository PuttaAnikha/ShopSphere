const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true
    },
    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'],
      default: 'ASSIGNED'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    pickedUpAt: {
      type: Date,
      default: null
    },
    outForDeliveryAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

deliverySchema.index({ deliveryPartnerId: 1, status: 1 });

const Delivery = mongoose.model('Delivery', deliverySchema);
module.exports = Delivery;
