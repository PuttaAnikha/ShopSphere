const mongoose = require('mongoose');

const orderItemEmbeddedSchema = new mongoose.Schema(
  {
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
      min: 1
    },
    priceAtPurchase: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
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
  { _id: true }
);

const sellerSubOrderSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true
    },
    sellerOrderNumber: {
      type: String,
      required: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    shippingAmount: {
      type: Number,
      default: 0,
      min: 0
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
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required']
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    items: [orderItemEmbeddedSchema],
    sellerOrders: [sellerSubOrderSchema],
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    shippingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Shipping amount cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null
    },
    couponCode: {
      type: String,
      default: ''
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      phone: { type: String, required: true }
    },
    paymentMethod: {
      type: String,
      enum: ['ONLINE_DEMO', 'CASH_ON_DELIVERY'],
      default: 'ONLINE_DEMO'
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    paymentDetails: {
      transactionId: { type: String, default: '' },
      paidAt: { type: Date, default: null }
    },
    orderStatus: {
      type: String,
      enum: {
        values: [
          'PLACED',
          'CONFIRMED',
          'PACKED',
          'SHIPPED',
          'DELIVERED',
          'CANCELLED',
          'RETURNED',
          'REFUNDED'
        ],
        message: '{VALUE} is not a valid order status'
      },
      default: 'PLACED'
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    returnReason: {
      type: String,
      default: ''
    },
    returnedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ 'items.sellerId': 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
