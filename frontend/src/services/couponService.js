import api from './api';

const couponService = {
  async validateCoupon(code, orderAmount) {
    const res = await api.post('/coupons/validate', { code, orderAmount });
    return res.data;
  },
};

export default couponService;
