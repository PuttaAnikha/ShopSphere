const request = require('supertest');
const app = require('../src/app');
const Coupon = require('../src/models/Coupon');
const { createTestUser } = require('./helpers');

describe('Coupons Management & Validation Tests', () => {
  let admin, adminToken;
  let customer, customerToken;

  beforeEach(async () => {
    const a = await createTestUser({ role: 'ADMIN' });
    admin = a.user;
    adminToken = a.token;

    const c = await createTestUser({ role: 'CUSTOMER' });
    customer = c.user;
    customerToken = c.token;
  });

  it('should allow admin to create a new coupon', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const res = await request(app)
      .post('/api/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'SAVE20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderAmount: 1000,
        maxDiscount: 500,
        expiryDate: futureDate.toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.coupon.code).toBe('SAVE20');
  });

  it('should successfully validate an active and applicable coupon', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    await Coupon.create({
      code: 'DISCOUNT100',
      discountType: 'FIXED',
      discountValue: 100,
      minOrderAmount: 500,
      expiryDate: futureDate,
      active: true
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        code: 'DISCOUNT100',
        orderAmount: 1000
      });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.discountAmount).toBe(100);
    expect(res.body.data.finalAmount).toBe(900);
  });

  it('should reject coupon if minimum order amount is not met', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    await Coupon.create({
      code: 'BIGSPENDER',
      discountType: 'PERCENTAGE',
      discountValue: 30,
      minOrderAmount: 5000,
      expiryDate: futureDate,
      active: true
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        code: 'BIGSPENDER',
        orderAmount: 2000 // Less than 5000
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject expired coupon', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    await Coupon.create({
      code: 'EXPIRED10',
      discountType: 'FIXED',
      discountValue: 10,
      expiryDate: pastDate,
      active: true
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        code: 'EXPIRED10',
        orderAmount: 1000
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject inactive coupon', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    await Coupon.create({
      code: 'INACTIVE50',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      expiryDate: futureDate,
      active: false
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        code: 'INACTIVE50',
        orderAmount: 1000
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
