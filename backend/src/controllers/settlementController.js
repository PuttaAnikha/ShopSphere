const Settlement = require('../models/Settlement');
const Seller = require('../models/Seller');
const { logAudit } = require('../utils/auditLogger');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');

const getAllSettlements = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, sellerId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (sellerId) query.sellerId = sellerId;

    const [settlements, total] = await Promise.all([
      Settlement.find(query)
        .populate('sellerId', 'storeName phone')
        .populate('orderId', 'orderNumber totalAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Settlement.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Settlements retrieved successfully',
      formatPaginatedResponse(settlements, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const getSellerSettlements = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, 404, 'Seller profile not found');
    }

    const { page, limit, skip } = getPagination(req.query);
    const { status } = req.query;

    const query = { sellerId: seller._id };
    if (status) query.status = status;

    const [settlements, total] = await Promise.all([
      Settlement.find(query)
        .populate('orderId', 'orderNumber totalAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Settlement.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Seller settlements retrieved successfully',
      formatPaginatedResponse(settlements, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const updateSettlementStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, transactionReference } = req.body;

    if (!['PENDING', 'PROCESSING', 'SETTLED', 'ON_HOLD'].includes(status)) {
      return errorResponse(res, 400, 'Invalid settlement status');
    }

    const settlement = await Settlement.findById(id);
    if (!settlement) {
      return errorResponse(res, 404, 'Settlement not found');
    }

    const oldStatus = settlement.status;
    settlement.status = status;
    if (transactionReference) settlement.transactionReference = transactionReference;
    if (status === 'SETTLED') settlement.settledAt = new Date();

    await settlement.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'SETTLEMENT_STATUS_UPDATE',
      entityType: 'Settlement',
      entityId: settlement._id,
      oldValue: { status: oldStatus },
      newValue: { status, transactionReference }
    });

    return successResponse(res, 200, `Settlement status updated to ${status}`, { settlement });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSettlements,
  getSellerSettlements,
  updateSettlementStatus
};
