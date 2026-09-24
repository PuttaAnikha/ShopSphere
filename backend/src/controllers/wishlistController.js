const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const UserActivity = require('../models/UserActivity');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate({
      path: 'products',
      select: 'name price discount images stock status brand specifications rating',
      populate: { path: 'sellerId', select: 'storeName rating' }
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
    }

    return successResponse(res, 200, 'Wishlist retrieved successfully', { wishlist });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    // Record user activity
    await UserActivity.create({
      userId: req.user._id,
      action: 'WISHLIST_ADD',
      productId: product._id,
      categoryId: product.categoryId
    }).catch(() => {});

    return successResponse(res, 200, 'Product added to wishlist', { wishlist });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      return errorResponse(res, 404, 'Wishlist not found');
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId.toString()
    );
    await wishlist.save();

    return successResponse(res, 200, 'Product removed from wishlist', { wishlist });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
