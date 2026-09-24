const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
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
      required: true
    },
    raisedBy: {
      type: String,
      enum: ['CUSTOMER', 'SELLER'],
      required: true
    },
    reason: {
      type: String,
      required: [true, 'Dispute reason is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Dispute description is required'],
      trim: true
    },
    evidence: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CLOSED'],
      default: 'OPEN'
    },
    resolution: {
      type: String,
      default: ''
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

disputeSchema.index({ orderId: 1 });
disputeSchema.index({ customerId: 1 });
disputeSchema.index({ sellerId: 1 });
disputeSchema.index({ status: 1 });

const Dispute = mongoose.model('Dispute', disputeSchema);
module.exports = Dispute;
