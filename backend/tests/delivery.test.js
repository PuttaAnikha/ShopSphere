const request = require('supertest');
const app = require('../src/app');
const Order = require('../src/models/Order');
const Delivery = require('../src/models/Delivery');
const { createTestUser } = require('./helpers');

describe('Delivery Partner APIs Tests', () => {
  let admin, adminToken;
  let deliveryPartner, deliveryPartnerToken;
  let otherPartner, otherPartnerToken;
  let order;

  beforeEach(async () => {
    const a = await createTestUser({ role: 'ADMIN' });
    admin = a.user;
    adminToken = a.token;

    const dp = await createTestUser({ role: 'DELIVERY_PARTNER' });
    deliveryPartner = dp.user;
    deliveryPartnerToken = dp.token;

    const odp = await createTestUser({ role: 'DELIVERY_PARTNER' });
    otherPartner = odp.user;
    otherPartnerToken = odp.token;

    const customer = await createTestUser({ role: 'CUSTOMER' });

    order = await Order.create({
      customerId: customer.user._id,
      orderNumber: `ORD-DELIVERY-${Date.now()}`,
      items: [],
      subtotal: 1000,
      totalAmount: 1000,
      shippingAddress: { street: 'Delivery St', city: 'City', state: 'State', postalCode: '111111', phone: '9999999999' },
      orderStatus: 'CONFIRMED'
    });
  });

  it('should allow Admin to assign a delivery partner', async () => {
    const res = await request(app)
      .post('/api/delivery/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        orderId: order._id.toString(),
        deliveryPartnerId: deliveryPartner._id.toString()
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.delivery.deliveryPartnerId).toBe(deliveryPartner._id.toString());
    expect(res.body.data.delivery.trackingNumber).toBeDefined();
  });

  it('should only show assigned deliveries to the delivery partner', async () => {
    await Delivery.create({
      orderId: order._id,
      deliveryPartnerId: deliveryPartner._id,
      trackingNumber: `TRK-${Date.now()}`,
      status: 'ASSIGNED'
    });

    const res = await request(app)
      .get('/api/delivery/orders')
      .set('Authorization', `Bearer ${deliveryPartnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);

    const otherRes = await request(app)
      .get('/api/delivery/orders')
      .set('Authorization', `Bearer ${otherPartnerToken}`);

    expect(otherRes.status).toBe(200);
    expect(otherRes.body.data.items.length).toBe(0);
  });

  it('should update delivery status and synchronize order status', async () => {
    const delivery = await Delivery.create({
      orderId: order._id,
      deliveryPartnerId: deliveryPartner._id,
      trackingNumber: `TRK-${Date.now()}`,
      status: 'ASSIGNED'
    });

    const updateRes = await request(app)
      .put(`/api/delivery/orders/${delivery._id}/status`)
      .set('Authorization', `Bearer ${deliveryPartnerToken}`)
      .send({ status: 'DELIVERED', notes: 'Handed to recipient' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.delivery.status).toBe('DELIVERED');

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.orderStatus).toBe('DELIVERED');
  });
});
