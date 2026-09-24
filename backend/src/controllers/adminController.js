const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Dispute = require('../models/Dispute');
const Refund = require('../models/Refund');
const AuditLog = require('../models/AuditLog');
const Review = require('../models/Review');
const notificationService = require('../services/notificationService');
const { logAudit } = require('../utils/auditLogger');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalSellers,
      pendingSellers,
      totalProducts,
      totalOrders,
      pendingDisputes,
      pendingRefunds
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['CUSTOMER', 'SELLER'] } }),
      Seller.countDocuments(),
      Seller.countDocuments({ approvalStatus: 'PENDING' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Dispute.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
      Refund.countDocuments({ status: { $in: ['PENDING', 'PROCESSING'] } })
    ]);

    // Aggregate total revenue from completed / paid orders
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Order status breakdown
    const orderStatuses = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    const statusMap = {};
    orderStatuses.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    return successResponse(res, 200, 'Admin dashboard metrics retrieved', {
      totalUsers,
      totalSellers,
      pendingSellers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingDisputes,
      pendingRefunds,
      orderStatusStatistics: statusMap
    });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    // Top 5 Categories by product count
    const topCategories = await Product.aggregate([
      { $group: { _id: '$categoryId', productCount: { $sum: 1 } } },
      { $sort: { productCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          name: '$category.name',
          productCount: 1
        }
      }
    ]);

    // Top 5 Sellers by revenue
    const topSellers = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.sellerId',
          totalRevenue: { $sum: '$items.subtotal' },
          totalItemsSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'sellers',
          localField: '_id',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      {
        $project: {
          _id: 1,
          storeName: '$seller.storeName',
          totalRevenue: 1,
          totalItemsSold: 1
        }
      }
    ]);

    return successResponse(res, 200, 'Admin reports retrieved successfully', {
      topCategories,
      topSellers
    });
  } catch (error) {
    next(error);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [products, total] = await Promise.all([
      Product.find().populate('sellerId', 'storeName').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments()
    ]);

    const reviews = await Review.find({ productId: { $in: products.map((product) => product._id) } })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });
    const reviewsByProduct = reviews.reduce((grouped, review) => {
      const productId = review.productId.toString();
      grouped[productId] = grouped[productId] || [];
      grouped[productId].push(review);
      return grouped;
    }, {});

    return successResponse(
      res,
      200,
      'Admin reviews retrieved successfully',
      formatPaginatedResponse(
        products.map((product) => ({
          product,
          reviews: reviewsByProduct[product._id.toString()] || []
        })),
        total,
        page,
        limit
      )
    );
  } catch (error) {
    next(error);
  }
};

const getSellers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, search } = req.query;

    const query = {};
    if (status) query.approvalStatus = status;
    if (search) {
      query.storeName = { $regex: search, $options: 'i' };
    }

    const [sellers, total] = await Promise.all([
      Seller.find(query)
        .populate('userId', 'name email phone status avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Seller.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Sellers retrieved successfully',
      formatPaginatedResponse(sellers, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const updateSellerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalStatus, rejectionReason } = req.body;

    if (!['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(approvalStatus)) {
      return errorResponse(res, 400, 'Invalid seller approval status');
    }

    const seller = await Seller.findById(id).populate('userId');
    if (!seller) {
      return errorResponse(res, 404, 'Seller not found');
    }

    const oldStatus = seller.approvalStatus;
    seller.approvalStatus = approvalStatus;
    if (rejectionReason) seller.rejectionReason = rejectionReason;
    await seller.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'SELLER_STATUS_UPDATE',
      entityType: 'Seller',
      entityId: seller._id,
      oldValue: { approvalStatus: oldStatus },
      newValue: { approvalStatus, rejectionReason }
    });

    // Notify seller
    if (seller.userId) {
      await notificationService.send({
        userId: seller.userId._id,
        title: `Seller Account ${approvalStatus}`,
        message: `Your seller application has been ${approvalStatus.toLowerCase()}.${rejectionReason ? ' Reason: ' + rejectionReason : ''}`,
        type: approvalStatus === 'APPROVED' ? 'SELLER_APPROVED' : 'SELLER_REJECTED',
        relatedEntity: 'Seller',
        relatedEntityId: seller._id
      });
    }

    return successResponse(res, 200, `Seller status updated to ${approvalStatus}`, { seller });
  } catch (error) {
    next(error);
  }
};

const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED', 'OUT_OF_STOCK'].includes(status)) {
      return errorResponse(res, 400, 'Invalid product status');
    }

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    const oldStatus = product.status;
    product.status = status;
    await product.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'PRODUCT_MODERATED',
      entityType: 'Product',
      entityId: product._id,
      oldValue: { status: oldStatus },
      newValue: { status }
    });

    // Notify seller
    const seller = await Seller.findById(product.sellerId);
    if (seller) {
      await notificationService.send({
        userId: seller.userId,
        title: 'Product Moderation Update',
        message: `Your product "${product.name}" status has been changed to ${status}.`,
        type: 'PRODUCT_MODERATED',
        relatedEntity: 'Product',
        relatedEntityId: product._id
      });
    }

    return successResponse(res, 200, `Product status updated to ${status}`, { product });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { entityType, action } = req.query;

    const query = {};
    if (entityType) query.entityType = entityType;
    if (action) query.action = action;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Audit logs retrieved successfully',
      formatPaginatedResponse(logs, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getReports,
  getReviews,
  getSellers,
  updateSellerStatus,
  updateProductStatus,
  getAuditLogs
};
