const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const {
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct
} = require('./helpers');

describe('Reviews & Ratings Management Tests', () => {
  let customer, customerToken;
  let seller, category, product;

  beforeEach(async () => {
    const c = await createTestUser({ role: 'CUSTOMER' });
    customer = c.user;
    customerToken = c.token;

    const s = await createTestSeller();
    seller = s.seller;

    category = await createTestCategory();
    product = await createTestProduct({ seller, category, name: 'Reviewed Headphones' });
  });

  it('should allow customer to review purchased product with verified purchase tag', async () => {
    // Simulate delivered order
    await Order.create({
      customerId: customer._id,
      orderNumber: `ORD-${Date.now()}`,
      items: [{
        productId: product._id,
        sellerId: seller._id,
        productName: product.name,
        quantity: 1,
        priceAtPurchase: 2000,
        subtotal: 2000,
        status: 'DELIVERED'
      }],
      subtotal: 2000,
      totalAmount: 2000,
      shippingAddress: { street: '1 St', city: 'City', state: 'State', postalCode: '111111', phone: '9999999999' },
      orderStatus: 'DELIVERED'
    });

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: product._id.toString(),
        rating: 5,
        comment: 'Outstanding quality and very fast shipping!'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.review.verifiedPurchase).toBe(true);
    expect(res.body.data.review.rating).toBe(5);

    // Verify product rating recalculated
    const updatedProd = await Product.findById(product._id);
    expect(updatedProd.rating).toBe(5);
    expect(updatedProd.reviewCount).toBe(1);
  });

  it('should reject review with invalid rating (e.g. rating > 5 or <= 0)', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: product._id.toString(),
        rating: 7, // Invalid
        comment: 'Too good'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should get public reviews for a product', async () => {
    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: product._id.toString(),
        rating: 4,
        comment: 'Very good product overall.'
      });

    const res = await request(app).get(`/api/products/${product._id}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].comment).toBe('Very good product overall.');
  });
});
