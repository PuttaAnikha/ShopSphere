const request = require('supertest');
const app = require('../src/app');
const { createTestUser } = require('./helpers');

describe('User Management Tests', () => {
  it('should allow Admin to get all users', async () => {
    const { token: adminToken } = await createTestUser({ role: 'ADMIN' });
    await createTestUser({ name: 'User 1' });
    await createTestUser({ name: 'User 2' });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(3);
  });

  it('should allow Admin to filter and search users', async () => {
    const { token: adminToken } = await createTestUser({ role: 'ADMIN' });
    await createTestUser({ name: 'Specific Name Finder', email: 'finder@example.com' });

    const res = await request(app)
      .get('/api/users?search=finder')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].email).toBe('finder@example.com');
  });

  it('should allow Admin to update user status to SUSPENDED', async () => {
    const { token: adminToken } = await createTestUser({ role: 'ADMIN' });
    const { user: targetUser } = await createTestUser({ status: 'ACTIVE' });

    const res = await request(app)
      .put(`/api/users/${targetUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe('SUSPENDED');
  });

  it('should forbid non-admin from accessing user management APIs', async () => {
    const { token: customerToken } = await createTestUser({ role: 'CUSTOMER' });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
