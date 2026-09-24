const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, authenticateOptional } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Generate description: restricted to sellers and admins
router.post(
  '/generate-description',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  aiController.generateDescription
);

// Semantic search: accessible by public or authenticated users
router.post('/semantic-search', authenticateOptional, aiController.semanticSearch);

// Recommendations: based on user activity or general popularity
router.get('/recommendations', authenticateOptional, aiController.getRecommendations);

module.exports = router;
