import api from './api';

const deliveryService = {
  async getAssignedDeliveries(params = {}) {
    const res = await api.get('/delivery/orders', { params });
    return res.data;
  },

  async getDeliveryById(id) {
    const res = await api.get(`/delivery/orders/${id}`);
    return res.data;
  },

  async updateDeliveryStatus(id, status, notes) {
    const res = await api.put(`/delivery/orders/${id}/status`, { status, notes });
    return res.data;
  },
};

export default deliveryService;
