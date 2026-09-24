const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/Product');
const {
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct
} = require('./helpers');

describe('AI Copywriting & Semantic Intelligence Tests', () => {
  let seller, sellerToken;
  let category, product1, product2;

  beforeEach(async () => {
    const s = await createTestSeller();
    seller = s.seller;
    sellerToken = s.token;

    category = await createTestCategory({ name: 'Laptops' });

    product1 = await createTestProduct({
      seller,
      category,
      name: 'Budget Coding Laptop',
      price: 35000,
      stock: 10,
      status: 'ACTIVE'
    });

    product2 = await createTestProduct({
      seller,
      category,
      name: 'Wireless Ergonomic Keyboard',
      price: 3000,
      stock: 15,
      status: 'ACTIVE'
    });
  });

  describe('POST /api/ai/generate-description', () => {
    it('should validate required name input', async () => {
      const res = await request(app)
        .post('/api/ai/generate-description')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ brand: 'Nova' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should generate product description with selling points structure', async () => {
      const res = await request(app)
        .post('/api/ai/generate-description')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'Noise Cancelling Headphones',
          brand: 'SonicPro',
          category: 'Audio',
          features: ['40h battery life', 'Active noise cancelling'],
          specifications: { Bluetooth: '5.3', Weight: '220g' }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBeDefined();
      expect(typeof res.body.data.description).toBe('string');
      expect(Array.isArray(res.body.data.keySellingPoints)).toBe(true);
      expect(res.body.data.keySellingPoints.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/ai/semantic-search', () => {
    it('should validate query string presence', async () => {
      const res = await request(app)
        .post('/api/ai/semantic-search')
        .send({ query: '' });

      expect(res.status).toBe(400);
    });

    it('should return ONLY actual MongoDB products matching natural language intent', async () => {
      const res = await request(app)
        .post('/api/ai/semantic-search')
        .send({ query: 'I need a budget laptop for coding' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toBeDefined();

      // Verify every returned item exists in MongoDB
      const returnedProducts = res.body.data.products;
      for (const p of returnedProducts) {
        const dbProduct = await Product.findById(p._id);
        expect(dbProduct).not.toBeNull();
      }
    });

    it('should fall back gracefully to active products if query has broad terms', async () => {
      const res = await request(app)
        .post('/api/ai/semantic-search')
        .send({ query: 'something completely extraordinary and unseen' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
    });
  });

  describe('GET /api/ai/recommendations', () => {
    it('should return products from MongoDB for recommendations', async () => {
      const res = await request(app).get('/api/ai/recommendations');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThan(0);
    });
  });
});
