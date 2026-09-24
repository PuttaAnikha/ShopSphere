const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    verifiedPurchase: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REJECTED', 'PENDING'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

// One review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, status: 1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
