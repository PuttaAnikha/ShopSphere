import api from './api';

const notificationService = {
  async getNotifications(params = {}) {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },
};

export default notificationService;
