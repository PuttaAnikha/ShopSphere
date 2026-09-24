const env = require('../config/env');
const Product = require('../models/Product');
const UserActivity = require('../models/UserActivity');
const Category = require('../models/Category');

class AIService {
  constructor() {
    this.provider = env.AI_PROVIDER || 'mock';
    this.apiKey = env.AI_API_KEY || '';
  }

  /**
   * AI Product Description Generator
   * Generates compelling product copy and key selling points
   */
  async generateProductDescription({ name, brand, category, features = [], specifications = {} }) {
    if (!name) {
      throw new Error('Product name is required for description generation');
    }

    // If an external AI provider (like OpenAI or Gemini) is configured, call it
    if (this.apiKey && (this.provider === 'openai' || this.provider === 'gemini')) {
      try {
        return await this.callExternalAIProvider({ name, brand, category, features, specifications });
      } catch (err) {
        console.warn(`[AIService] External AI provider error: ${err.message}. Falling back to internal engine.`);
      }
    }

    // High quality intelligent generation fallback
    return this.generateInternalDescription({ name, brand, category, features, specifications });
  }

  generateInternalDescription({ name, brand, category, features = [], specifications = {} }) {
    const brandPrefix = brand ? `${brand} ` : '';
    const categoryName = category ? ` in the ${category} category` : '';
    const featureList = Array.isArray(features) && features.length > 0
      ? features.join(', ')
      : 'high-quality performance, modern aesthetics, and exceptional durability';

    const specEntries = Object.entries(specifications || {});
    const specHighlight = specEntries.length > 0
      ? ` Engineered with precision including ${specEntries.map(([k, v]) => `${k}: ${v}`).slice(0, 3).join(', ')}.`
      : '';

    const description = `Discover the next level of innovation with the ${brandPrefix}${name}. Designed for discerning customers seeking top-tier quality${categoryName}, this product delivers unmatched reliability and craftsmanship. Featuring ${featureList}, it seamlessly elevates your everyday lifestyle.${specHighlight} Backed by premium design standards, the ${name} is the ideal blend of performance, versatility, and elegance.`;

    const keySellingPoints = [
      `Premium ${brand ? brand + ' ' : ''}craftsmanship engineered for longevity`,
      Array.isArray(features) && features[0] ? `Key Highlight: ${features[0]}` : 'Optimized for high performance and daily durability',
      Array.isArray(features) && features[1] ? `Convenience: ${features[1]}` : 'Ergonomic, user-centric modern design',
      'Tested and certified for safety, reliability, and satisfaction',
      'Comprehensive customer support and seller warranty included'
    ];

    return {
      description,
      keySellingPoints
    };
  }

  async callExternalAIProvider({ name, brand, category, features, specifications }) {
    // If OpenAI API key is provided
    if (this.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert e-commerce copywriter. Return ONLY valid JSON with fields "description" (string) and "keySellingPoints" (array of 4-5 bullet strings).'
            },
            {
              role: 'user',
              content: `Write an engaging product description for Name: "${name}", Brand: "${brand}", Category: "${category}", Features: ${JSON.stringify(features)}, Specifications: ${JSON.stringify(specifications)}.`
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}`);
      }
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      return JSON.parse(content);
    }

    return this.generateInternalDescription({ name, brand, category, features, specifications });
  }

  /**
   * Semantic Product Search
   * Interprets user intent and queries ACTUAL MongoDB products
   */
  async semanticSearch(query) {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error('Search query is required');
    }

    const cleanQuery = query.toLowerCase().trim();
    const mongoQuery = { status: 'ACTIVE' };

    // Extract price constraints if present
    const priceMatchUnder = cleanQuery.match(/(?:under|below|less than|max(?:imum)?)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
    const priceMatchAbove = cleanQuery.match(/(?:above|over|more than|min(?:imum)?)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
    const budgetKeyword = cleanQuery.includes('budget') || cleanQuery.includes('cheap') || cleanQuery.includes('affordable');

    if (priceMatchUnder) {
      mongoQuery.price = { ...mongoQuery.price, $lte: parseFloat(priceMatchUnder[1]) };
    } else if (budgetKeyword) {
      // Suggesting lower-mid tier
      mongoQuery.price = { ...mongoQuery.price, $lte: 50000 };
    }

    if (priceMatchAbove) {
      mongoQuery.price = { ...mongoQuery.price, $gte: parseFloat(priceMatchAbove[1]) };
    }

    // Try matching categories by name
    const categories = await Category.find({ status: 'ACTIVE' });
    const matchedCategories = categories.filter((c) =>
      cleanQuery.includes(c.name.toLowerCase()) || cleanQuery.includes(c.slug)
    );

    if (matchedCategories.length > 0) {
      mongoQuery.categoryId = { $in: matchedCategories.map((c) => c._id) };
    }

    // Extract significant keywords
    const stopWords = new Set(['i', 'need', 'a', 'an', 'the', 'for', 'with', 'in', 'and', 'or', 'to', 'of', 'is', 'good', 'best', 'want', 'looking']);
    const keywords = cleanQuery
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    let products = [];

    // First attempt: match keywords across name, brand, and description
    if (keywords.length > 0) {
      const keywordRegexes = keywords.map((k) => new RegExp(k, 'i'));
      const textQuery = {
        ...mongoQuery,
        $or: [
          { name: { $in: keywordRegexes } },
          { brand: { $in: keywordRegexes } },
          { description: { $in: keywordRegexes } }
        ]
      };
      products = await Product.find(textQuery)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'storeName rating')
        .sort({ rating: -1, createdAt: -1 })
        .limit(20);
    }

    // Fallback if no products found with keyword filters
    if (products.length === 0) {
      delete mongoQuery.$or;
      products = await Product.find(mongoQuery)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'storeName rating')
        .sort({ rating: -1 })
        .limit(10);
    }

    // If still empty (e.g. constraints were too narrow), return top active products
    if (products.length === 0) {
      products = await Product.find({ status: 'ACTIVE' })
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'storeName rating')
        .sort({ rating: -1 })
        .limit(10);
    }

    return {
      query,
      interpretedIntent: {
        keywords,
        priceConstraint: mongoQuery.price || null,
        categories: matchedCategories.map((c) => c.name)
      },
      count: products.length,
      products
    };
  }

  /**
   * AI Recommendations based on user activity
   */
  async getRecommendations(userId) {
    if (!userId) {
      // Default trending recommendations for anonymous users
      return Product.find({ status: 'ACTIVE' })
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'storeName rating')
        .sort({ rating: -1, reviewCount: -1 })
        .limit(10);
    }

    // Fetch user recent activities
    const activities = await UserActivity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    if (activities.length === 0) {
      return Product.find({ status: 'ACTIVE' })
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'storeName rating')
        .sort({ rating: -1, reviewCount: -1 })
        .limit(10);
    }

    // Collect interacted category IDs and product IDs
    const categoryFreq = {};
    const excludedProductIds = new Set();

    activities.forEach((act) => {
      if (act.categoryId) {
        const catIdStr = act.categoryId.toString();
        categoryFreq[catIdStr] = (categoryFreq[catIdStr] || 0) + 1;
      }
      if (act.action === 'PURCHASE' && act.productId) {
        excludedProductIds.add(act.productId.toString());
      }
    });

    const topCategoryIds = Object.keys(categoryFreq)
      .sort((a, b) => categoryFreq[b] - categoryFreq[a])
      .slice(0, 3);

    const query = {
      status: 'ACTIVE',
      _id: { $nin: Array.from(excludedProductIds) }
    };

    if (topCategoryIds.length > 0) {
      query.categoryId = { $in: topCategoryIds };
    }

    let recommended = await Product.find(query)
      .populate('categoryId', 'name slug')
      .populate('sellerId', 'storeName rating')
      .sort({ rating: -1, stock: -1 })
      .limit(10);

    // If not enough products in those categories, supplement with top-rated items
    if (recommended.length < 5) {
      const remainingLimit = 10 - recommended.length;
      const existingIds = recommended.map((p) => p._id);
      const moreProducts = await Product.find({
        status: 'ACTIVE',
        _id: { $nin: [...Array.from(excludedProductIds), ...existingIds] }
      })
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'storeName rating')
        .sort({ rating: -1 })
        .limit(remainingLimit);

      recommended = [...recommended, ...moreProducts];
    }

    return recommended;
  }
}

module.exports = new AIService();
