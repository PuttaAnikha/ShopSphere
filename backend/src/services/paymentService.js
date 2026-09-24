const crypto = require('crypto');
const env = require('../config/env');

class PaymentService {
  constructor() {
    this.provider = env.PAYMENT_PROVIDER || 'mock';
  }

  /**
   * Create a payment intent or order
   * @param {Object} paymentData - { amount, currency, orderId, customerEmail }
   * @returns {Promise<Object>} Payment initiation response
   */
  async createPayment({ amount, currency = 'INR', orderId, customerEmail }) {
    if (!amount || amount <= 0) {
      throw new Error('Valid payment amount is required');
    }

    // In a real gateway (e.g. Razorpay / Stripe), call gateway SDK here
    const paymentId = `pay_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `sec_${crypto.randomBytes(16).toString('hex')}`;

    return {
      provider: this.provider,
      paymentId,
      clientSecret,
      amount,
      currency,
      orderId,
      status: 'INITIATED',
      paymentUrl: `https://checkout.shopsphere.test/pay/${paymentId}`
    };
  }

  /**
   * Verify payment signature or transaction status
   * @param {Object} verificationData - { paymentId, transactionId, signature }
   * @returns {Promise<Object>} Verification status
   */
  async verifyPayment({ paymentId, transactionId, signature }) {
    // In mock mode, if transactionId or paymentId is provided, consider it successfully paid
    if (!paymentId && !transactionId) {
      return { success: false, message: 'Missing payment identifier' };
    }

    return {
      success: true,
      transactionId: transactionId || `txn_${crypto.randomBytes(8).toString('hex')}`,
      paymentId: paymentId || `pay_${crypto.randomBytes(8).toString('hex')}`,
      status: 'SUCCESSFUL',
      verifiedAt: new Date()
    };
  }

  /**
   * Process refund for an order or item
   * @param {Object} refundData - { orderId, amount, reason, transactionId }
   * @returns {Promise<Object>} Refund response
   */
  async processRefund({ orderId, amount, reason, transactionId }) {
    if (!amount || amount <= 0) {
      throw new Error('Valid refund amount is required');
    }

    const refundId = `ref_${crypto.randomBytes(10).toString('hex')}`;

    return {
      success: true,
      refundId,
      orderId,
      amount,
      reason,
      status: 'COMPLETED',
      refundedAt: new Date()
    };
  }
}

module.exports = new PaymentService();
