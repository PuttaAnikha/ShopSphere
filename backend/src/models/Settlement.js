const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0
    },
    platformCommission: {
      type: Number,
      default: 0,
      min: 0
    },
    refundAdjustment: {
      type: Number,
      default: 0,
      min: 0
    },
    netAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SETTLED', 'ON_HOLD'],
      default: 'PENDING'
    },
    settledAt: {
      type: Date,
      default: null
    },
    transactionReference: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

settlementSchema.index({ sellerId: 1, status: 1 });
settlementSchema.index({ orderId: 1 });

const Settlement = mongoose.model('Settlement', settlementSchema);
module.exports = Settlement;
