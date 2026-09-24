const request = require('supertest');
const app = require('../src/app');
const Order = require('../src/models/Order');
const Refund = require('../src/models/Refund');
const { createTestUser } = require('./helpers');

describe('Refunds & Payment Gateway Integration Tests', () => {
  let customer, customerToken;
  let admin, adminToken;
  let order;

  beforeEach(async () => {
    const c = await createTestUser({ role: 'CUSTOMER' });
    customer = c.user;
    customerToken = c.token;

    const a = await createTestUser({ role: 'ADMIN' });
    admin = a.user;
    adminToken = a.token;

    order = await Order.create({
      customerId: customer._id,
      orderNumber: `ORD-REF-${Date.now()}`,
      items: [],
      subtotal: 5000,
      totalAmount: 5000,
      shippingAddress: { street: 'Refund St', city: 'City', state: 'State', postalCode: '111111', phone: '9999999999' },
      orderStatus: 'RETURNED'
    });
  });

  it('should create a refund request', async () => {
    const res = await request(app)
      .post('/api/refunds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: order._id.toString(),
        amount: 5000,
        reason: 'Product returned as agreed'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.refund.amount).toBe(5000);
    expect(res.body.data.refund.status).toBe('PENDING');
  });

  it('should reject refund exceeding total order amount', async () => {
    const res = await request(app)
      .post('/api/refunds')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: order._id.toString(),
        amount: 8000, // Order total is 5000
        reason: 'Overcharge'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should process refund status to COMPLETED via payment service', async () => {
    const refund = await Refund.create({
      orderId: order._id,
      customerId: customer._id,
      amount: 5000,
      reason: 'Approved refund',
      status: 'PENDING'
    });

    const res = await request(app)
      .put(`/api/refunds/${refund._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.data.refund.status).toBe('COMPLETED');
    expect(res.body.data.refund.gatewayTransactionId).toBeDefined();

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).toBe('REFUNDED');
  });
});
