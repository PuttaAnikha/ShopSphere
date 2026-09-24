import api from './api';

const orderService = {
  async createOrder(data) {
    const res = await api.post('/orders', data);
    return res.data;
  },

  async getOrders(params = {}) {
    const res = await api.get('/orders', { params });
    return res.data;
  },

  async getOrderById(id) {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  async updateOrderStatus(id, status) {
    const res = await api.put(`/orders/${id}/status`, { status });
    return res.data;
  },

  async cancelOrder(id, reason) {
    const res = await api.post(`/orders/${id}/cancel`, { reason });
    return res.data;
  },

  async returnOrder(id, data) {
    const res = await api.post(`/orders/${id}/return`, data);
    return res.data;
  },
};

export default orderService;
