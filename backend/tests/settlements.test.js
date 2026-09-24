const request = require('supertest');
const app = require('../src/app');
const Settlement = require('../src/models/Settlement');
const Order = require('../src/models/Order');
const { createTestUser, createTestSeller } = require('./helpers');

describe('Seller Settlements & Platform Commission Tests', () => {
  let admin, adminToken;
  let seller, sellerToken;
  let otherSeller, otherSellerToken;
  let order;

  beforeEach(async () => {
    const a = await createTestUser({ role: 'ADMIN' });
    admin = a.user;
    adminToken = a.token;

    const s = await createTestSeller({ storeName: 'Payout Store' });
    seller = s.seller;
    sellerToken = s.token;

    const os = await createTestSeller({ storeName: 'Other Payout Store' });
    otherSeller = os.seller;
    otherSellerToken = os.token;

    const customer = await createTestUser();
    order = await Order.create({
      customerId: customer.user._id,
      orderNumber: `ORD-SETTLE-${Date.now()}`,
      items: [],
      subtotal: 10000,
      totalAmount: 10000,
      shippingAddress: { street: 'Settlement Ave', city: 'City', state: 'State', postalCode: '111111', phone: '9999999999' }
    });

    await Settlement.create({
      sellerId: seller._id,
      orderId: order._id,
      grossAmount: 10000,
      platformCommission: 1000, // 10%
      netAmount: 9000,
      status: 'PENDING'
    });
  });

  it('should allow seller to view their own settlement records', async () => {
    const res = await request(app)
      .get('/api/settlements/seller')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].netAmount).toBe(9000);
    expect(res.body.data.items[0].platformCommission).toBe(1000);
  });

  it('should isolate settlements between sellers', async () => {
    const res = await request(app)
      .get('/api/settlements/seller')
      .set('Authorization', `Bearer ${otherSellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(0);
  });

  it('should allow admin to view all settlements and update payout status', async () => {
    const settlement = await Settlement.findOne({ sellerId: seller._id });

    const updateRes = await request(app)
      .put(`/api/settlements/${settlement._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'SETTLED',
        transactionReference: 'BANK-UTR-998877'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.settlement.status).toBe('SETTLED');
    expect(updateRes.body.data.settlement.transactionReference).toBe('BANK-UTR-998877');
  });
});
