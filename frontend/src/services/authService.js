import api from './api';

const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('shopsphere_token');
    localStorage.removeItem('shopsphere_user');
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },

  async changePassword(data) {
    const res = await api.put('/auth/change-password', data);
    return res.data;
  },
};

export default authService;
