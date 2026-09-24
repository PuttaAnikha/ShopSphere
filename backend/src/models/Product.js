const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: [true, 'Seller ID is required']
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required']
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100 percent']
    },
    brand: {
      type: String,
      trim: true,
      default: ''
    },
    images: {
      type: [String],
      default: []
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    specifications: {
      type: Map,
      of: String,
      default: {}
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5']
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED', 'OUT_OF_STOCK'],
        message: '{VALUE} is not a valid product status'
      },
      default: 'PENDING'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for high performance querying & filters
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
