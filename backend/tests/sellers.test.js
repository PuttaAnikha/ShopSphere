const request = require('supertest');
const app = require('../src/app');
const Seller = require('../src/models/Seller');
const { createTestUser, createTestSeller, createTestCategory } = require('./helpers');

describe('Seller Management & Approval Tests', () => {
  it('should register seller as PENDING approval', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Pending Seller',
        email: 'pending_seller@example.com',
        password: 'Password123!',
        role: 'SELLER',
        storeName: 'Pending Innovations'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.seller.approvalStatus).toBe('PENDING');
  });

  it('should allow Admin to approve a seller', async () => {
    const { token: adminToken } = await createTestUser({ role: 'ADMIN' });
    const { seller } = await createTestSeller({ approvalStatus: 'PENDING' });

    const res = await request(app)
      .put(`/api/admin/sellers/${seller._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approvalStatus: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.seller.approvalStatus).toBe('APPROVED');
  });

  it('should allow approved seller to create a product', async () => {
    const { seller, token: sellerToken } = await createTestSeller({ approvalStatus: 'APPROVED' });
    const category = await createTestCategory();

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Approved Product',
        description: 'Quality approved device',
        price: 999,
        stock: 50,
        categoryId: category._id.toString()
      });

    expect(res.status).toBe(201);
    expect(res.body.data.product.name).toBe('Approved Product');
  });

  it('should prevent PENDING or REJECTED seller from creating a product', async () => {
    const { token: rejectedSellerToken } = await createTestSeller({ approvalStatus: 'REJECTED' });
    const category = await createTestCategory();

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${rejectedSellerToken}`)
      .send({
        name: 'Illegal Product',
        description: 'Should not be allowed',
        price: 999,
        stock: 10,
        categoryId: category._id.toString()
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow seller to fetch and update their profile', async () => {
    const { token: sellerToken } = await createTestSeller({ storeName: 'Old Store Name' });

    const getRes = await request(app)
      .get('/api/seller/profile')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.seller.storeName).toBe('Old Store Name');

    const updateRes = await request(app)
      .put('/api/seller/profile')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ storeName: 'New Brand Name' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.seller.storeName).toBe('New Brand Name');
  });
});
