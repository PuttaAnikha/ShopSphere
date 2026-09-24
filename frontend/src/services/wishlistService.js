import api from './api';

const wishlistService = {
  async getWishlist() {
    const res = await api.get('/wishlist');
    return res.data;
  },

  async addToWishlist(productId) {
    const res = await api.post(`/wishlist/${productId}`);
    return res.data;
  },

  async removeFromWishlist(productId) {
    const res = await api.delete(`/wishlist/${productId}`);
    return res.data;
  },
};

export default wishlistService;
