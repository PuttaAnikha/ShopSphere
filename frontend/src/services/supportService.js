import api from './api';

const supportService = {
  async getTickets(params = {}) {
    const res = await api.get('/support/tickets', { params });
    return res.data;
  },

  async getTicketById(id) {
    const res = await api.get(`/support/tickets/${id}`);
    return res.data;
  },

  async createTicket(data) {
    const res = await api.post('/support/tickets', data);
    return res.data;
  },

  async updateTicket(id, data) {
    const res = await api.put(`/support/tickets/${id}`, data);
    return res.data;
  },

  async addMessage(id, message) {
    const res = await api.post(`/support/tickets/${id}/messages`, { message });
    return res.data;
  },
};

export default supportService;
