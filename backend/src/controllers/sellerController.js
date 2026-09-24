const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Settlement = require('../models/Settlement');
const inventoryService = require('../services/inventoryService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const getProfile = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id }).populate('userId', 'name email phone avatar');
    if (!seller) {
      return errorResponse(res, 404, 'Seller profile not found');
    }
    return successResponse(res, 200, 'Seller profile retrieved', { seller });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { storeName, description, phone, address, logo, businessInfo } = req.body;
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, 404, 'Seller profile not found');
    }

    if (storeName) seller.storeName = storeName;
    if (description !== undefined) seller.description = description;
    if (phone !== undefined) seller.phone = phone;
    if (logo !== undefined) seller.logo = logo;
    if (address) {
      seller.address = { ...seller.address.toObject(), ...address };
    }
    if (businessInfo) {
      seller.businessInfo = { ...seller.businessInfo.toObject(), ...businessInfo };
    }

    await seller.save();
    return successResponse(res, 200, 'Seller profile updated', { seller });
  } catch (error) {
    next(error);
  }
};

const getInventory = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, 404, 'Seller profile not found');
    }

    const { page, limit } = getPagination(req.query);
    const { filter } = req.query;

    const inventoryData = await inventoryService.getSellerInventory(seller._id, {
      page,
      limit,
      filter
    });

    return successResponse(res, 200, 'Inventory retrieved successfully', inventoryData);
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, 404, 'Seller profile not found');
    }

    const sellerId = seller._id;

    // Direct MongoDB aggregations for seller
    const [totalProducts, outOfStockProducts, lowStockProducts] = await Promise.all([
      Product.countDocuments({ sellerId }),
      Product.countDocuments({ sellerId, stock: 0 }),
      Product.countDocuments({ sellerId, stock: { $gt: 0, $lte: 5 } })
    ]);

    const orderStats = await Order.aggregate([
      { $match: { 'items.sellerId': sellerId } },
      { $unwind: '$items' },
      { $match: { 'items.sellerId': sellerId } },
      {
        $group: {
          _id: null,
          totalOrders: { $addToSet: '$orderNumber' },
          totalRevenue: { $sum: '$items.subtotal' },
          totalItemsSold: { $sum: '$items.quantity' }
        }
      },
      {
        $project: {
          totalOrdersCount: { $size: '$totalOrders' },
          totalRevenue: 1,
          totalItemsSold: 1
        }
      }
    ]);

    const revenue = orderStats.length > 0 ? orderStats[0].totalRevenue : 0;
    const totalOrdersCount = orderStats.length > 0 ? orderStats[0].totalOrdersCount : 0;
    const totalItemsSold = orderStats.length > 0 ? orderStats[0].totalItemsSold : 0;

    // Pending vs Completed orders
    const pendingOrdersCount = await Order.countDocuments({
      'items.sellerId': sellerId,
      orderStatus: { $in: ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED'] }
    });

    const completedOrdersCount = await Order.countDocuments({
      'items.sellerId': sellerId,
      orderStatus: 'DELIVERED'
    });

    return successResponse(res, 200, 'Seller dashboard data retrieved', {
      storeName: seller.storeName,
      approvalStatus: seller.approvalStatus,
      rating: seller.rating,
      metrics: {
        totalRevenue: revenue,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
        totalItemsSold,
        totalProducts,
        lowStockProducts,
        outOfStockProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, 404, 'Seller profile not found');
    }

    const sellerId = seller._id;

    // Top selling products for this seller
    const topProducts = await Order.aggregate([
      { $match: { 'items.sellerId': sellerId } },
      { $unwind: '$items' },
      { $match: { 'items.sellerId': sellerId } },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 5 }
    ]);

    // Order status statistics
    const statusStatistics = await Order.aggregate([
      { $match: { 'items.sellerId': sellerId } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    return successResponse(res, 200, 'Seller analytics retrieved', {
      topProducts,
      statusStatistics: statusStatistics.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    next(error);
  }
};

const getRevenue = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, 404, 'Seller profile not found');
    }

    const sellerId = seller._id;

    const settlements = await Settlement.find({ sellerId }).sort({ createdAt: -1 });
    const totalGross = settlements.reduce((acc, s) => acc + s.grossAmount, 0);
    const totalCommission = settlements.reduce((acc, s) => acc + s.platformCommission, 0);
    const totalNet = settlements.reduce((acc, s) => acc + s.netAmount, 0);

    return successResponse(res, 200, 'Seller revenue details retrieved', {
      summary: {
        totalGross,
        totalCommission,
        totalNet
      },
      settlements
    });
  } catch (error) {
    next(error);
  }
};

const getOrderStatistics = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, 404, 'Seller profile not found');
    }

    const sellerId = seller._id;

    const stats = await Order.aggregate([
      { $match: { 'items.sellerId': sellerId } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      PLACED: 0,
      CONFIRMED: 0,
      PACKED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      RETURNED: 0,
      REFUNDED: 0
    };

    stats.forEach((s) => {
      if (formattedStats[s._id] !== undefined) {
        formattedStats[s._id] = s.count;
      }
    });

    return successResponse(res, 200, 'Order statistics retrieved', formattedStats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getInventory,
  getDashboard,
  getAnalytics,
  getRevenue,
  getOrderStatistics
};
