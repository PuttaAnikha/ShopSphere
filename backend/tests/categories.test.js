const request = require('supertest');
const app = require('../src/app');
const { createTestUser, createTestCategory } = require('./helpers');

describe('Category Management Tests', () => {
  it('should allow admin to create a category', async () => {
    const { token: adminToken } = await createTestUser({ role: 'ADMIN' });

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Home Audio',
        description: 'Speakers and soundbars'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category.name).toBe('Home Audio');
    expect(res.body.data.category.slug).toBe('home-audio');
  });

  it('should allow admin to update a category', async () => {
    const { token: adminToken } = await createTestUser({ role: 'ADMIN' });
    const category = await createTestCategory({ name: 'Cameras' });

    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        description: 'DSLR and mirrorless cameras'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.category.description).toBe('DSLR and mirrorless cameras');
  });

  it('should prevent non-admin from creating or modifying category', async () => {
    const { token: customerToken } = await createTestUser({ role: 'CUSTOMER' });

    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Disallowed' });

    expect(createRes.status).toBe(403);
    expect(createRes.body.success).toBe(false);
  });

  it('should allow public access to list categories', async () => {
    await createTestCategory({ name: 'Books' });

    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.categories.length).toBeGreaterThanOrEqual(1);
  });
});
