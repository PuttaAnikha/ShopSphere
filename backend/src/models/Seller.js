const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' }
    },
    logo: {
      type: String,
      default: ''
    },
    businessInfo: {
      taxId: { type: String, trim: true, default: '' },
      registrationNumber: { type: String, trim: true, default: '' },
      bankAccount: {
        accountHolderName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        bankName: { type: String, default: '' },
        ifscCode: { type: String, default: '' }
      }
    },
    approvalStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
        message: '{VALUE} is not a valid approval status'
      },
      default: 'PENDING'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5']
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

sellerSchema.index({ approvalStatus: 1 });
sellerSchema.index({ storeName: 'text', description: 'text' });

const Seller = mongoose.model('Seller', sellerSchema);
module.exports = Seller;
