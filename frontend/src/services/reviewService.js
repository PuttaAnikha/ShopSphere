import api from './api';

const reviewService = {
  async createReview(data) {
    const res = await api.post('/reviews', data);
    return res.data;
  },

  async updateReview(id, data) {
    const res = await api.put(`/reviews/${id}`, data);
    return res.data;
  },

  async deleteReview(id) {
    const res = await api.delete(`/reviews/${id}`);
    return res.data;
  },
};

export default reviewService;
