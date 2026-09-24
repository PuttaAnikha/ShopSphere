const Product = require('../models/Product');
const Category = require('../models/Category');
const Seller = require('../models/Seller');
const UserActivity = require('../models/UserActivity');
const imageService = require('../services/imageService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');
const { logAudit } = require('../utils/auditLogger');

const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      seller,
      brand,
      minPrice,
      maxPrice,
      rating,
      availability,
      hasDiscount,
      sort,
      status
    } = req.query;

    const { page, limit, skip } = getPagination(req.query);

    // By default, public only sees ACTIVE products unless admin/seller specifies otherwise
    const query = req.user?.role === 'ADMIN' ? {} : { status: 'ACTIVE' };
    if (status && req.user?.role === 'ADMIN') query.status = status;

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter (supports either ObjectId or name/slug)
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.categoryId = category;
      } else {
        const foundCategory = await Category.findOne({
          $or: [{ slug: category.toLowerCase() }, { name: { $regex: category, $options: 'i' } }]
        });
        if (foundCategory) {
          query.categoryId = foundCategory._id;
        } else {
          return successResponse(res, 200, 'Products retrieved successfully', {
            items: [],
            pagination: { total: 0, page, limit, totalPages: 1, hasNextPage: false, hasPrevPage: false }
          });
        }
      }
    }

    // Seller filter
    if (seller) {
      query.sellerId = seller;
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: `^${brand}$`, $options: 'i' };
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (rating !== undefined) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Availability filter
    if (availability === 'in_stock') {
      query.stock = { $gt: 0 };
    } else if (availability === 'out_of_stock') {
      query.stock = 0;
    }

    // Discount filter
    if (hasDiscount === 'true' || hasDiscount === true) {
      query.discount = { $gt: 0 };
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    else if (sort === 'price_desc') sortOptions = { price: -1 };
    else if (sort === 'rating') sortOptions = { rating: -1 };
    else if (sort === 'newest') sortOptions = { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'storeName rating logo')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    // Record user activity if user is logged in & searched
    if (req.user && search) {
      await UserActivity.create({
        userId: req.user._id,
        action: 'SEARCH',
        searchQuery: search
      }).catch(() => {});
    }

    return successResponse(
      res,
      200,
      'Products retrieved successfully',
      formatPaginatedResponse(products, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name slug description')
      .populate('sellerId', 'storeName description rating phone logo');

    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Track view activity if user is authenticated
    if (req.user) {
      await UserActivity.create({
        userId: req.user._id,
        action: 'PRODUCT_VIEW',
        productId: product._id,
        categoryId: product.categoryId ? product.categoryId._id : null
      }).catch(() => {});
    }

    return successResponse(res, 200, 'Product retrieved successfully', { product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const seller = req.seller; // Attached by requireApprovedSeller middleware
    if (!seller) {
      return errorResponse(res, 403, 'Approved seller account required');
    }

    const {
      name,
      description,
      price,
      discount = 0,
      brand,
      stock,
      categoryId,
      specifications,
      images = []
    } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return errorResponse(res, 404, 'Category not found');
    }

    // Handle files if uploaded via multer
    let imageUrls = Array.isArray(images) ? [...images] : [images];
    if (req.files && req.files.length > 0) {
      const uploadedUrls = await imageService.uploadMultipleImages(req.files, 'products');
      imageUrls = [...imageUrls, ...uploadedUrls];
    }

    const product = await Product.create({
      sellerId: seller._id,
      categoryId,
      name,
      description,
      price: parseFloat(price),
      discount: parseFloat(discount),
      brand: brand || '',
      images: imageUrls,
      stock: parseInt(stock, 10),
      specifications: specifications || {},
      status: parseInt(stock, 10) === 0 ? 'OUT_OF_STOCK' : 'ACTIVE'
    });

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product._id,
      newValue: { name: product.name, price: product.price, stock: product.stock }
    });

    return successResponse(res, 201, 'Product created successfully', { product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Role and ownership check
    if (req.user.role === 'SELLER') {
      const seller = await Seller.findOne({ userId: req.user._id });
      if (!seller || product.sellerId.toString() !== seller._id.toString()) {
        return errorResponse(res, 403, 'Forbidden: You can only update your own products');
      }
    } else if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 403, 'Forbidden: Unauthorized');
    }

    const {
      name,
      description,
      price,
      discount,
      brand,
      stock,
      categoryId,
      specifications,
      images,
      status
    } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (discount !== undefined) product.discount = parseFloat(discount);
    if (brand !== undefined) product.brand = brand;
    if (specifications) product.specifications = specifications;
    if (images) product.images = Array.isArray(images) ? images : [images];

    if (stock !== undefined) {
      const newStock = parseInt(stock, 10);
      product.stock = newStock;
      if (newStock === 0) {
        product.status = 'OUT_OF_STOCK';
      } else if (product.status === 'OUT_OF_STOCK') {
        product.status = 'ACTIVE';
      }
    }

    // Status changes by Admin (or seller setting INACTIVE)
    if (status) {
      if (req.user.role === 'ADMIN') {
        product.status = status;
      } else if (req.user.role === 'SELLER' && ['ACTIVE', 'INACTIVE'].includes(status)) {
        product.status = status;
      }
    }

    if (categoryId) {
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return errorResponse(res, 404, 'Category not found');
      }
      product.categoryId = categoryId;
    }

    await product.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: product._id,
      newValue: { name: product.name, price: product.price, status: product.status }
    });

    return successResponse(res, 200, 'Product updated successfully', { product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Check ownership
    if (req.user.role === 'SELLER') {
      const seller = await Seller.findOne({ userId: req.user._id });
      if (!seller || product.sellerId.toString() !== seller._id.toString()) {
        return errorResponse(res, 403, 'Forbidden: You can only delete your own products');
      }
    } else if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 403, 'Forbidden: Unauthorized');
    }

    await Product.findByIdAndDelete(req.params.id);

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'PRODUCT_DELETED',
      entityType: 'Product',
      entityId: req.params.id,
      oldValue: { name: product.name }
    });

    return successResponse(res, 200, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getSellerProducts = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, 404, 'Seller profile not found');
    }

    const { page, limit, skip } = getPagination(req.query);
    const { status, search } = req.query;

    const query = { sellerId: seller._id };
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Seller products retrieved successfully',
      formatPaginatedResponse(products, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts
};
