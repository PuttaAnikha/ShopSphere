import api from './api';

const productService = {
  async getProducts(params = {}) {
    const res = await api.get('/products', { params });
    return res.data;
  },

  async getProductById(id) {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  async createProduct(data) {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await api.post('/products', data, config);
    return res.data;
  },

  async updateProduct(id, data) {
    const res = await api.put(`/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id) {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  async getProductReviews(productId) {
    const res = await api.get(`/products/${productId}/reviews`);
    return res.data;
  },
};

export default productService;
