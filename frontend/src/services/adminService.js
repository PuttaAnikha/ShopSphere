import api from './api';

const adminService = {
  async getDashboard() {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  async getReports(params = {}) {
    const res = await api.get('/admin/reports', { params });
    return res.data;
  },

  async getReviews(params = {}) {
    const res = await api.get('/admin/reviews', { params });
    return res.data;
  },

  async updateReview(id, data) {
    const res = await api.put(`/reviews/${id}`, data);
    return res.data;
  },

  async getSellers(params = {}) {
    const res = await api.get('/admin/sellers', { params });
    return res.data;
  },

  async updateSellerStatus(id, statusOrData) {
    const payload = typeof statusOrData === 'string'
      ? { approvalStatus: statusOrData, status: statusOrData }
      : { approvalStatus: statusOrData.approvalStatus || statusOrData.status, ...statusOrData };
    const res = await api.put(`/admin/sellers/${id}/status`, payload);
    return res.data;
  },

  async updateProductStatus(id, status) {
    const res = await api.put(`/admin/products/${id}/status`, { status });
    return res.data;
  },

  // Users (uses /api/users)
  async getUsers(params = {}) {
    const res = await api.get('/users', { params });
    return res.data;
  },

  async getUserById(id) {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  async updateUserStatus(id, status) {
    const res = await api.put(`/users/${id}/status`, { status });
    return res.data;
  },

  // Categories (uses /api/categories)
  async getCategories(params = {}) {
    const res = await api.get('/categories', { params });
    return res.data;
  },

  async createCategory(data) {
    const res = await api.post('/categories', data);
    return res.data;
  },

  async updateCategory(id, data) {
    const res = await api.put(`/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id) {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },

  // Coupons (uses /api/coupons)
  async getCoupons(params = {}) {
    const res = await api.get('/coupons', { params });
    return res.data;
  },

  async getCouponById(id) {
    const res = await api.get(`/coupons/${id}`);
    return res.data;
  },

  async createCoupon(data) {
    const res = await api.post('/coupons', data);
    return res.data;
  },

  async updateCoupon(id, data) {
    const res = await api.put(`/coupons/${id}`, data);
    return res.data;
  },

  async deleteCoupon(id) {
    const res = await api.delete(`/coupons/${id}`);
    return res.data;
  },

  // Products for admin
  async getProducts(params = {}) {
    const res = await api.get('/products', { params });
    return res.data;
  },

  // Orders for admin
  async getOrders(params = {}) {
    const res = await api.get('/orders', { params });
    return res.data;
  },

  // Disputes
  async getDisputes(params = {}) {
    const res = await api.get('/disputes', { params });
    return res.data;
  },

  async getAuditLogs(params = {}) {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },

  async getDisputeById(id) {
    const res = await api.get(`/disputes/${id}`);
    return res.data;
  },

  async resolveDispute(id, data) {
    const res = await api.put(`/disputes/${id}/resolve`, data);
    return res.data;
  },
};

export default adminService;
