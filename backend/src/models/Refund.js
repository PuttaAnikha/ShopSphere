const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      default: null
    },
    amount: {
      type: Number,
      required: [true, 'Refund amount is required'],
      min: [0, 'Refund amount cannot be negative']
    },
    reason: {
      type: String,
      required: [true, 'Refund reason is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    gatewayTransactionId: {
      type: String,
      default: ''
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    processedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

refundSchema.index({ orderId: 1 });
refundSchema.index({ customerId: 1 });
refundSchema.index({ sellerId: 1 });
refundSchema.index({ status: 1 });

const Refund = mongoose.model('Refund', refundSchema);
module.exports = Refund;
