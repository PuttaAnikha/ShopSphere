const request = require('supertest');
const app = require('../src/app');
const {
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct
} = require('./helpers');

describe('Cart APIs & Multi-Vendor Inventory Validation Tests', () => {
  let customer, customerToken;
  let seller1, seller2, category, product1, product2;

  beforeEach(async () => {
    const c = await createTestUser({ role: 'CUSTOMER' });
    customer = c.user;
    customerToken = c.token;

    const s1 = await createTestSeller({ storeName: 'Vendor Alpha' });
    seller1 = s1.seller;

    const s2 = await createTestSeller({ storeName: 'Vendor Beta' });
    seller2 = s2.seller;

    category = await createTestCategory();

    product1 = await createTestProduct({
      seller: seller1,
      category,
      name: 'Alpha Shoes',
      price: 3000,
      stock: 5
    });

    product2 = await createTestProduct({
      seller: seller2,
      category,
      name: 'Beta Bag',
      price: 2000,
      stock: 10
    });
  });

  it('should add products from multiple vendors to the customer cart', async () => {
    const res1 = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product1._id.toString(), quantity: 2 });

    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product2._id.toString(), quantity: 1 });

    expect(res2.status).toBe(200);

    const getRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.items.length).toBe(2);
    expect(getRes.body.data.groupedBySeller.length).toBe(2);
    expect(getRes.body.data.cartTotal).toBe(3000 * 2 + 2000 * 1);
  });

  it('should prevent adding quantity exceeding available stock', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product1._id.toString(), quantity: 10 }); // Stock is 5

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should prevent adding inactive or out-of-stock product to cart', async () => {
    const inactiveProduct = await createTestProduct({
      seller: seller1,
      category,
      name: 'Inactive Watch',
      status: 'INACTIVE',
      stock: 10
    });

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: inactiveProduct._id.toString(), quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should update cart item quantity and delete cart item', async () => {
    const addRes = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product1._id.toString(), quantity: 1 });

    const itemId = addRes.body.data.cart.items[0]._id;

    // Update quantity
    const updateRes = await request(app)
      .put(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ quantity: 3 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.cart.items[0].quantity).toBe(3);

    // Delete item
    const deleteRes = await request(app)
      .delete(`/api/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.cart.items.length).toBe(0);
  });
});
