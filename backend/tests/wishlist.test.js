const request = require('supertest');
const app = require('../src/app');
const {
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct
} = require('./helpers');

describe('Wishlist APIs Tests', () => {
  let customer, customerToken;
  let seller, category, product;

  beforeEach(async () => {
    const c = await createTestUser({ role: 'CUSTOMER' });
    customer = c.user;
    customerToken = c.token;

    const s = await createTestSeller();
    seller = s.seller;

    category = await createTestCategory();
    product = await createTestProduct({ seller, category });
  });

  it('should add product to wishlist and retrieve it', async () => {
    const addRes = await request(app)
      .post(`/api/wishlist/${product._id}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(addRes.status).toBe(200);
    expect(addRes.body.success).toBe(true);

    const getRes = await request(app)
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.wishlist.products.length).toBe(1);
    expect(getRes.body.data.wishlist.products[0]._id.toString()).toBe(product._id.toString());
  });

  it('should remove product from wishlist', async () => {
    await request(app)
      .post(`/api/wishlist/${product._id}`)
      .set('Authorization', `Bearer ${customerToken}`);

    const removeRes = await request(app)
      .delete(`/api/wishlist/${product._id}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.wishlist.products.length).toBe(0);
  });

  it('should reject wishlist operations for non-customer roles', async () => {
    const { token: sellerToken } = await createTestUser({ role: 'SELLER' });

    const res = await request(app)
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
