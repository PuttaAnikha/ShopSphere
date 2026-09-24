const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/Product');
const AuditLog = require('../src/models/AuditLog');
const {
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct
} = require('./helpers');

describe('Admin Analytics, Moderation & Audit Log Tests', () => {
  let admin, adminToken;
  let seller, category, product;

  beforeEach(async () => {
    const a = await createTestUser({ role: 'ADMIN' });
    admin = a.user;
    adminToken = a.token;

    const s = await createTestSeller({ approvalStatus: 'PENDING' });
    seller = s.seller;

    category = await createTestCategory();
    product = await createTestProduct({ seller, category, status: 'PENDING' });
  });

  it('should retrieve admin dashboard analytics metrics', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUsers).toBeDefined();
    expect(res.body.data.totalSellers).toBeDefined();
    expect(res.body.data.pendingSellers).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalProducts).toBeGreaterThanOrEqual(1);
  });

  it('should retrieve admin reports', async () => {
    const res = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.topCategories).toBeDefined();
    expect(res.body.data.topSellers).toBeDefined();
  });

  it('should moderate product status and record audit log', async () => {
    const res = await request(app)
      .put(`/api/admin/products/${product._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.product.status).toBe('ACTIVE');

    // Verify audit log exists
    const logs = await AuditLog.find({ entityId: product._id, action: 'PRODUCT_MODERATED' });
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });

  it('should retrieve audit logs list', async () => {
    // Generate an audit log
    await AuditLog.create({
      userId: admin._id,
      role: 'ADMIN',
      action: 'TEST_ADMIN_ACTION',
      entityType: 'System'
    });

    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
  });
});
