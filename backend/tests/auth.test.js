const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Seller = require('../src/models/Seller');
const { createTestUser } = require('./helpers');

describe('Authentication & Authorization Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should successfully register a customer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Customer',
          email: 'jane@example.com',
          password: 'Password123!',
          role: 'CUSTOMER'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should successfully register a seller with PENDING approval status', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Seller',
          email: 'sellerjohn@example.com',
          password: 'Password123!',
          role: 'SELLER',
          storeName: 'John Mega Store',
          storeDescription: 'Electronics and gadgets'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('SELLER');
      expect(res.body.data.seller).toBeDefined();
      expect(res.body.data.seller.storeName).toBe('John Mega Store');
      expect(res.body.data.seller.approvalStatus).toBe('PENDING');
    });

    it('should reject registration if email is already registered', async () => {
      await createTestUser({ email: 'duplicate@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'duplicate@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should prevent public registration with ADMIN role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker Admin',
          email: 'hacker@example.com',
          password: 'Password123!',
          role: 'ADMIN'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user with correct credentials', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login User',
          email: 'login@example.com',
          password: 'Password123!'
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('login@example.com');
    });

    it('should reject login with wrong password', async () => {
      await createTestUser({ email: 'wrongpwd@example.com', password: 'Password123!' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpwd@example.com',
          password: 'IncorrectPassword!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('JWT Verification & Protected Routes', () => {
    it('should reject access to protected endpoint without JWT', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject access with invalid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_malformed_token_123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow access with valid JWT', async () => {
      const { user, token } = await createTestUser();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id).toBe(user._id.toString());
    });

    it('should reject access when user status is SUSPENDED', async () => {
      const { token } = await createTestUser({ status: 'SUSPENDED' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should enforce role-based authorization', async () => {
      const { token } = await createTestUser({ role: 'CUSTOMER' });

      // Admin route
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
