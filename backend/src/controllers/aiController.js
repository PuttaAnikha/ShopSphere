const aiService = require('../services/aiService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateDescription = async (req, res, next) => {
  try {
    const { name, brand, category, features, specifications } = req.body;
    if (!name) {
      return errorResponse(res, 400, 'Product name is required for description generation');
    }

    const result = await aiService.generateProductDescription({
      name,
      brand,
      category,
      features,
      specifications
    });

    return successResponse(res, 200, 'Description generated successfully', result);
  } catch (error) {
    next(error);
  }
};

const semanticSearch = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return errorResponse(res, 400, 'Search query string is required');
    }

    const results = await aiService.semanticSearch(query);
    return successResponse(res, 200, 'Semantic search completed', results);
  } catch (error) {
    next(error);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const products = await aiService.getRecommendations(userId);
    return successResponse(res, 200, 'Product recommendations retrieved', { products });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateDescription,
  semanticSearch,
  getRecommendations
};
