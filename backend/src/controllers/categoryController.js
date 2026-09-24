const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logAudit } = require('../utils/auditLogger');

const getCategories = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const categories = await Category.find(query).sort({ name: 1 });
    return successResponse(res, 200, 'Categories retrieved successfully', { categories });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }
    return successResponse(res, 200, 'Category retrieved successfully', { category });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, image, status } = req.body;
    if (!name) {
      return errorResponse(res, 400, 'Category name is required');
    }

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return errorResponse(res, 409, 'Category with this name already exists');
    }

    const category = await Category.create({
      name: name.trim(),
      description,
      image,
      status: status || 'ACTIVE'
    });

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: category._id,
      newValue: { name: category.name }
    });

    return successResponse(res, 201, 'Category created successfully', { category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description, image, status } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    const oldValue = { name: category.name, status: category.status };

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (status) category.status = status;

    await category.save();

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'CATEGORY_UPDATED',
      entityType: 'Category',
      entityId: category._id,
      oldValue,
      newValue: { name: category.name, status: category.status }
    });

    return successResponse(res, 200, 'Category updated successfully', { category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return errorResponse(res, 404, 'Category not found');
    }

    await Category.findByIdAndDelete(req.params.id);

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: 'CATEGORY_DELETED',
      entityType: 'Category',
      entityId: req.params.id,
      oldValue: { name: category.name }
    });

    return successResponse(res, 200, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
