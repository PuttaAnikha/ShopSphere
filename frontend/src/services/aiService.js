import api from './api';

const aiService = {
  async generateDescription(data) {
    // data: { name, brand, category, specifications, price }
    const res = await api.post('/ai/generate-description', data);
    return res.data;
  },

  async semanticSearch(query, limit = 10) {
    const res = await api.post('/ai/semantic-search', { query, limit });
    return res.data;
  },

  async getRecommendations(params = {}) {
    const res = await api.get('/ai/recommendations', { params });
    return res.data;
  },
};

export default aiService;
