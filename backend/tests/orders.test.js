const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/Product');
const {
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct
} = require('./helpers');

describe('Multi-Vendor Orders & Inventory Management Tests', () => {
  let customer, customerToken;
  let sellerA, sellerAToken;
  let sellerB, sellerBToken;
  let admin, adminToken;
  let category, productA, productB;

  beforeEach(async () => {
    const c = await createTestUser({ role: 'CUSTOMER' });
    customer = c.user;
    customerToken = c.token;

    const sA = await createTestSeller({ storeName: 'Seller Alpha' });
    sellerA = sA.seller;
    sellerAToken = sA.token;

    const sB = await createTestSeller({ storeName: 'Seller Beta' });
    sellerB = sB.seller;
    sellerBToken = sB.token;

    const adm = await createTestUser({ role: 'ADMIN' });
    admin = adm.user;
    adminToken = adm.token;

    category = await createTestCategory();

    productA = await createTestProduct({
      seller: sellerA,
      category,
      name: 'Alpha Shoes',
      price: 3000,
      stock: 10
    });

    productB = await createTestProduct({
      seller: sellerB,
      category,
      name: 'Beta Laptop',
      price: 60000,
      stock: 5
    });
  });

  it('should checkout multi-vendor cart, create master order, and split seller items', async () => {
    // 1. Add to cart
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: productA._id.toString(), quantity: 3 });

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: productB._id.toString(), quantity: 1 });

    // 2. Checkout
    const checkoutRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shippingAddress: {
          street: '10 High Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          phone: '9876543210'
        }
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.success).toBe(true);
    const order = checkoutRes.body.data.order;

    expect(order.orderNumber).toBeDefined();
    expect(order.items.length).toBe(2);
    expect(order.sellerOrders.length).toBe(2);
    expect(order.totalAmount).toBe(3000 * 3 + 60000 * 1);

    // 3. Verify stock decreased accurately
    const refreshedProductA = await Product.findById(productA._id);
    const refreshedProductB = await Product.findById(productB._id);
    expect(refreshedProductA.stock).toBe(7); // 10 - 3 = 7
    expect(refreshedProductB.stock).toBe(4); // 5 - 1 = 4

    // 4. Verify Seller Isolation: Seller A sees only Seller A's items
    const sellerARes = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${sellerAToken}`);

    expect(sellerARes.status).toBe(200);
    expect(sellerARes.body.data.order.items.length).toBe(1);
    expect(sellerARes.body.data.order.items[0].productName).toBe('Alpha Shoes');

    // 5. Verify Seller Isolation: Seller B sees only Seller B's items
    const sellerBRes = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${sellerBToken}`);

    expect(sellerBRes.status).toBe(200);
    expect(sellerBRes.body.data.order.items.length).toBe(1);
    expect(sellerBRes.body.data.order.items[0].productName).toBe('Beta Laptop');

    // 6. Customer sees complete order
    const customerRes = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(customerRes.status).toBe(200);
    expect(customerRes.body.data.order.items.length).toBe(2);

    // 7. Admin sees complete order
    const adminRes = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.order.items.length).toBe(2);
  });

  it('should validate status transitions: PLACED -> CONFIRMED -> PACKED -> SHIPPED -> DELIVERED', async () => {
    // Create order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ productId: productA._id.toString(), quantity: 1 }],
        shippingAddress: {
          street: '10 High Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          phone: '9876543210'
        }
      });

    const orderId = orderRes.body.data.order._id;

    // Illegal jump: PLACED -> DELIVERED should fail
    const illegalRes = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DELIVERED' });

    expect(illegalRes.status).toBe(400);

    // Valid progression
    const s1 = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });
    expect(s1.status).toBe(200);

    const s2 = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PACKED' });
    expect(s2.status).toBe(200);

    const s3 = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SHIPPED' });
    expect(s3.status).toBe(200);

    const s4 = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DELIVERED' });
    expect(s4.status).toBe(200);
  });

  it('should cancel order and restore stock to inventory', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ productId: productA._id.toString(), quantity: 2 }],
        shippingAddress: {
          street: '10 High Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          phone: '9876543210'
        }
      });

    const orderId = orderRes.body.data.order._id;
    // Initial stock was 10, after purchase 8
    expect((await Product.findById(productA._id)).stock).toBe(8);

    // Cancel order
    const cancelRes = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Changed mind' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.order.orderStatus).toBe('CANCELLED');

    // Restored stock: 8 + 2 = 10
    expect((await Product.findById(productA._id)).stock).toBe(10);
  });
});
