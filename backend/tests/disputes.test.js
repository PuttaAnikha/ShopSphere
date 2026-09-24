const request = require('supertest');
const app = require('../src/app');
const Order = require('../src/models/Order');
const Dispute = require('../src/models/Dispute');
const {
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct
} = require('./helpers');

describe('Order Disputes Management Tests', () => {
  let customer, customerToken;
  let seller, sellerToken;
  let admin, adminToken;
  let order;

  beforeEach(async () => {
    const c = await createTestUser({ role: 'CUSTOMER' });
    customer = c.user;
    customerToken = c.token;

    const s = await createTestSeller();
    seller = s.seller;
    sellerToken = s.token;

    const a = await createTestUser({ role: 'ADMIN' });
    admin = a.user;
    adminToken = a.token;

    const category = await createTestCategory();
    const product = await createTestProduct({ seller, category });

    order = await Order.create({
      customerId: customer._id,
      orderNumber: `ORD-${Date.now()}`,
      items: [{
        productId: product._id,
        sellerId: seller._id,
        productName: product.name,
        quantity: 1,
        priceAtPurchase: 1000,
        subtotal: 1000,
        status: 'DELIVERED'
      }],
      subtotal: 1000,
      totalAmount: 1000,
      shippingAddress: { street: 'Main St', city: 'City', state: 'State', postalCode: '111111', phone: '9999999999' },
      orderStatus: 'DELIVERED'
    });
  });

  it('should allow customer to file a dispute against an order', async () => {
    const res = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: order._id.toString(),
        sellerId: seller._id.toString(),
        reason: 'Item physically damaged',
        description: 'Screen was cracked upon opening package'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dispute.status).toBe('OPEN');
    expect(res.body.data.dispute.reason).toBe('Item physically damaged');
  });

  it('should allow admin or support agent to resolve a dispute', async () => {
    const disputeRes = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: order._id.toString(),
        sellerId: seller._id.toString(),
        reason: 'Missing item',
        description: 'One piece missing'
      });

    const disputeId = disputeRes.body.data.dispute._id;

    const resolveRes = await request(app)
      .put(`/api/disputes/${disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'RESOLVED',
        resolution: 'Full refund granted to customer'
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.dispute.status).toBe('RESOLVED');
    expect(resolveRes.body.data.dispute.resolution).toBe('Full refund granted to customer');
  });
});
