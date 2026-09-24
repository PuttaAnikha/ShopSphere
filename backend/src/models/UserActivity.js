const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      enum: ['PRODUCT_VIEW', 'SEARCH', 'WISHLIST_ADD', 'CART_ADD', 'PURCHASE'],
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ action: 1 });
userActivitySchema.index({ productId: 1 });
userActivitySchema.index({ categoryId: 1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
module.exports = UserActivity;
