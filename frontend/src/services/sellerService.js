import api from './api';

const sellerService = {
  async getDashboard() {
    const res = await api.get('/seller/dashboard');
    return res.data;
  },

  async getAnalytics(params = {}) {
    const res = await api.get('/seller/analytics', { params });
    return res.data;
  },

  async getRevenue(params = {}) {
    const res = await api.get('/seller/revenue', { params });
    return res.data;
  },

  async getOrderStatistics(params = {}) {
    const res = await api.get('/seller/orders/statistics', { params });
    return res.data;
  },

  async getProfile() {
    const res = await api.get('/seller/profile');
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/seller/profile', data);
    return res.data;
  },

  async getInventory(params = {}) {
    const res = await api.get('/seller/inventory', { params });
    return res.data;
  },

  async getProducts(params = {}) {
    const res = await api.get('/seller/products', { params });
    return res.data;
  },
};

export default sellerService;
