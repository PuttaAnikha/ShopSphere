const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');

// Helper to recalculate product rating and review count
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId, status: 'ACTIVE' } },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].reviewCount
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0
    });
  }
};

const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return errorResponse(res, 409, 'You have already reviewed this product');
    }

    // Check if this is a verified purchase: user has an order with status DELIVERED containing this product
    const deliveredOrder = await Order.findOne({
      customerId: userId,
      orderStatus: 'DELIVERED',
      'items.productId': productId
    });

    const isVerified = !!deliveredOrder;

    const review = await Review.create({
      userId,
      productId,
      orderId: deliveredOrder ? deliveredOrder._id : null,
      rating: parseInt(rating, 10),
      comment,
      verifiedPurchase: isVerified,
      status: 'ACTIVE'
    });

    await updateProductRating(product._id);

    return successResponse(res, 201, 'Review submitted successfully', { review });
  } catch (error) {
    next(error);
  }
};

const getProductReviews = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { page, limit, skip } = getPagination(req.query);

    const query = { productId, status: 'ACTIVE' };
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('userId', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Product reviews retrieved successfully',
      formatPaginatedResponse(reviews, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment, status } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    // Check ownership or admin
    if (req.user.role !== 'ADMIN' && review.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Forbidden: You can only edit your own review');
    }

    if (rating !== undefined) review.rating = parseInt(rating, 10);
    if (comment) review.comment = comment;
    if (status && req.user.role === 'ADMIN') review.status = status;

    await review.save();
    await updateProductRating(review.productId);

    return successResponse(res, 200, 'Review updated successfully', { review });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    // Check ownership or admin
    if (req.user.role !== 'ADMIN' && review.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Forbidden: You can only delete your own review');
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(id);
    await updateProductRating(productId);

    return successResponse(res, 200, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview
};
