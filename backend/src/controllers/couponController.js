const Coupon = require('../models/Coupon');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');
const { logAudit } = require('../utils/auditLogger');

const getCoupons = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { active } = req.query;

    const query = {};
    if (active !== undefined) query.active = active === 'true';

    const [coupons, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Coupons retrieved successfully',
      formatPaginatedResponse(coupons, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const getCouponById = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return errorResponse(res, 404, 'Coupon not found');
    }
    return successResponse(res, 200, 'Coupon retrieved successfully', { coupon });
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
      active
    } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return errorResponse(res, 409, 'Coupon code already exists');
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
      active: active !== undefined ? active : true
    });

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'COUPON_CREATED',
      entityType: 'Coupon',
      entityId: coupon._id,
      newValue: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue }
    });

    return successResponse(res, 201, 'Coupon created successfully', { coupon });
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return errorResponse(res, 404, 'Coupon not found');
    }

    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
      active
    } = req.body;

    if (code) coupon.code = code.toUpperCase().trim();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = parseFloat(discountValue);
    if (minOrderAmount !== undefined) coupon.minOrderAmount = parseFloat(minOrderAmount);
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (startDate) coupon.startDate = new Date(startDate);
    if (expiryDate) coupon.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit ? parseInt(usageLimit, 10) : null;
    if (active !== undefined) coupon.active = active;

    await coupon.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'COUPON_UPDATED',
      entityType: 'Coupon',
      entityId: coupon._id,
      newValue: { code: coupon.code, active: coupon.active }
    });

    return successResponse(res, 200, 'Coupon updated successfully', { coupon });
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return errorResponse(res, 404, 'Coupon not found');
    }

    await Coupon.findByIdAndDelete(req.params.id);

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'COUPON_DELETED',
      entityType: 'Coupon',
      entityId: req.params.id,
      oldValue: { code: coupon.code }
    });

    return successResponse(res, 200, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
};

const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) {
      return errorResponse(res, 400, 'Coupon code is required');
    }

    const subtotal = parseFloat(orderAmount) || 0;
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return errorResponse(res, 404, 'Invalid coupon code');
    }

    if (!coupon.active) {
      return errorResponse(res, 400, 'Coupon is currently inactive');
    }

    const now = new Date();
    if (coupon.startDate > now) {
      return errorResponse(res, 400, 'Coupon is not yet active');
    }

    if (coupon.expiryDate < now) {
      return errorResponse(res, 400, 'Coupon has expired');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return errorResponse(res, 400, 'Coupon usage limit has been reached');
    }

    if (subtotal < coupon.minOrderAmount) {
      return errorResponse(
        res,
        400,
        `Order amount must be at least ₹${coupon.minOrderAmount} to apply this coupon`
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === 'FIXED') {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, subtotal);
    const finalAmount = Math.max(0, subtotal - discount);

    return successResponse(res, 200, 'Coupon is valid', {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
      subtotal,
      finalAmount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
};
