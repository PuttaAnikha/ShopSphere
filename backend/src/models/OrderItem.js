const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    productImage: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    priceAtPurchase: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    status: {
      type: String,
      enum: [
        'PLACED',
        'CONFIRMED',
        'PACKED',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'RETURNED',
        'REFUNDED'
      ],
      default: 'PLACED'
    }
  },
  {
    timestamps: true
  }
);

orderItemSchema.index({ orderId: 1 });
orderItemSchema.index({ sellerId: 1 });
orderItemSchema.index({ productId: 1 });

const OrderItem = mongoose.model('OrderItem', orderItemSchema);
module.exports = OrderItem;
