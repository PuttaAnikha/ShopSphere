const request = require('supertest');
const app = require('../src/app');
const { createTestUser, createTestSeller, createTestCategory, createTestProduct } = require('./helpers');

describe('Product APIs & Isolation Tests', () => {
  let seller1, seller1Token;
  let seller2, seller2Token;
  let category;

  beforeEach(async () => {
    const s1 = await createTestSeller({ storeName: 'Vendor One' });
    seller1 = s1.seller;
    seller1Token = s1.token;

    const s2 = await createTestSeller({ storeName: 'Vendor Two' });
    seller2 = s2.seller;
    seller2Token = s2.token;

    category = await createTestCategory();
  });

  it('should allow seller to create a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({
        name: 'Gaming Mouse',
        description: 'RGB optical high DPI gaming mouse',
        price: 2500,
        stock: 20,
        categoryId: category._id.toString(),
        brand: 'GamerGear'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.name).toBe('Gaming Mouse');
    expect(res.body.data.product.sellerId).toBe(seller1._id.toString());
  });

  it('should get public products with pagination', async () => {
    await createTestProduct({ seller: seller1, category, name: 'Item 1' });
    await createTestProduct({ seller: seller1, category, name: 'Item 2' });

    const res = await request(app).get('/api/products?page=1&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.pagination.total).toBe(2);
    expect(res.body.data.pagination.totalPages).toBe(2);
  });

  it('should get product by ID', async () => {
    const product = await createTestProduct({ seller: seller1, category, name: 'Target Phone' });

    const res = await request(app).get(`/api/products/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe('Target Phone');
  });

  it('should allow seller to update own product', async () => {
    const product = await createTestProduct({ seller: seller1, category, name: 'Old Product Name' });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ name: 'Updated Product Name', price: 3000 });

    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe('Updated Product Name');
    expect(res.body.data.product.price).toBe(3000);
  });

  it('should prevent seller from updating another seller’s product', async () => {
    const product = await createTestProduct({ seller: seller1, category, name: 'Seller 1 Product' });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${seller2Token}`)
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow seller to delete own product', async () => {
    const product = await createTestProduct({ seller: seller1, category });

    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${seller1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should filter and search products accurately', async () => {
    await createTestProduct({ seller: seller1, category, name: 'Special Laptop', price: 60000 });
    await createTestProduct({ seller: seller1, category, name: 'Budget Earbuds', price: 1500 });

    const searchRes = await request(app).get('/api/products?search=Laptop');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.items.length).toBe(1);
    expect(searchRes.body.data.items[0].name).toBe('Special Laptop');

    const priceRes = await request(app).get('/api/products?minPrice=50000');
    expect(priceRes.status).toBe(200);
    expect(priceRes.body.data.items.length).toBe(1);
    expect(priceRes.body.data.items[0].name).toBe('Special Laptop');
  });
});
