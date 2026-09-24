const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: {
        values: ['PERCENTAGE', 'FIXED'],
        message: '{VALUE} is not a valid discount type'
      },
      required: [true, 'Discount type is required']
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative']
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative']
    },
    maxDiscount: {
      type: Number,
      default: null, // null means uncapped
      min: [0, 'Maximum discount cannot be negative']
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required']
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
      min: [1, 'Usage limit must be at least 1']
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative']
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

couponSchema.index({ active: 1, expiryDate: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
