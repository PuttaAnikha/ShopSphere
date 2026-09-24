const Cart = require('../models/Cart');
const Product = require('../models/Product');
const UserActivity = require('../models/UserActivity');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id })
      .populate({
        path: 'items.productId',
        select: 'name price discount images stock status brand specifications'
      })
      .populate({
        path: 'items.sellerId',
        select: 'storeName logo rating'
      });

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Group items by seller for clear multi-vendor UI visualization
    const itemsBySeller = {};
    let cartTotal = 0;
    let totalItems = 0;

    cart.items.forEach((item) => {
      const sellerId = item.sellerId ? item.sellerId._id.toString() : 'unknown';
      const sellerName = item.sellerId ? item.sellerId.storeName : 'Unknown Seller';

      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = {
          sellerId,
          sellerName,
          items: [],
          subtotal: 0
        };
      }

      const itemTotal = item.price * item.quantity;
      cartTotal += itemTotal;
      totalItems += item.quantity;

      itemsBySeller[sellerId].items.push({
        _id: item._id,
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
        itemTotal
      });
      itemsBySeller[sellerId].subtotal += itemTotal;
    });

    return successResponse(res, 200, 'Cart retrieved successfully', {
      cartId: cart._id,
      items: cart.items,
      groupedBySeller: Object.values(itemsBySeller),
      totalItems,
      cartTotal
    });
  } catch (error) {
    next(error);
  }
};

const addItemToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const requestedQty = parseInt(quantity, 10);

    if (!productId) {
      return errorResponse(res, 400, 'Product ID is required');
    }

    if (isNaN(requestedQty) || requestedQty <= 0) {
      return errorResponse(res, 400, 'Quantity must be at least 1');
    }

    // Fetch actual product from MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    if (product.status !== 'ACTIVE') {
      return errorResponse(res, 400, `Product cannot be added to cart (Status: ${product.status})`);
    }

    if (product.stock < requestedQty) {
      return errorResponse(
        res,
        400,
        `Cannot add ${requestedQty} units. Only ${product.stock} units available in stock.`
      );
    }

    // Calculate effective price from MongoDB directly (never from client)
    const effectivePrice = product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + requestedQty;
      if (newQuantity > product.stock) {
        return errorResponse(
          res,
          400,
          `Cannot add item. Maximum available stock is ${product.stock}, but cart would have ${newQuantity}.`
        );
      }
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = effectivePrice; // Refresh price to latest
    } else {
      cart.items.push({
        productId: product._id,
        sellerId: product.sellerId,
        quantity: requestedQty,
        price: effectivePrice
      });
    }

    await cart.save();

    // Track activity
    await UserActivity.create({
      userId: req.user._id,
      action: 'CART_ADD',
      productId: product._id,
      categoryId: product.categoryId
    }).catch(() => {});

    return successResponse(res, 200, 'Item added to cart', { cart });
  } catch (error) {
    next(error);
  }
};

const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const newQty = parseInt(quantity, 10);

    if (isNaN(newQty) || newQty <= 0) {
      return errorResponse(res, 400, 'Quantity must be at least 1');
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return errorResponse(res, 404, 'Cart not found');
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return errorResponse(res, 404, 'Cart item not found');
    }

    // Verify stock
    const product = await Product.findById(item.productId);
    if (!product || product.status !== 'ACTIVE') {
      return errorResponse(res, 400, 'Product is no longer active');
    }

    if (product.stock < newQty) {
      return errorResponse(
        res,
        400,
        `Cannot set quantity to ${newQty}. Only ${product.stock} units available in stock.`
      );
    }

    item.quantity = newQty;
    // Update price to current
    item.price = product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

    await cart.save();

    return successResponse(res, 200, 'Cart item quantity updated', { cart });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return errorResponse(res, 404, 'Cart not found');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    if (cart.items.length === initialLength) {
      return errorResponse(res, 404, 'Cart item not found');
    }

    await cart.save();
    return successResponse(res, 200, 'Item removed from cart', { cart });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { items: [] },
      { new: true, upsert: true }
    );
    return successResponse(res, 200, 'Cart cleared successfully', { cart });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
};
