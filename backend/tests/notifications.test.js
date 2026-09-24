const request = require('supertest');
const app = require('../src/app');
const Notification = require('../src/models/Notification');
const { createTestUser } = require('./helpers');

describe('Notifications Management Tests', () => {
  let user1, user1Token;
  let user2, user2Token;

  beforeEach(async () => {
    const u1 = await createTestUser();
    user1 = u1.user;
    user1Token = u1.token;

    const u2 = await createTestUser();
    user2 = u2.user;
    user2Token = u2.token;

    await Notification.create([
      {
        userId: user1._id,
        title: 'Order Shipped',
        message: 'Your order is on the way',
        type: 'ORDER_SHIPPED'
      },
      {
        userId: user1._id,
        title: 'Refund Approved',
        message: 'Refund has been credited',
        type: 'REFUND_PROCESSED'
      },
      {
        userId: user2._id,
        title: 'User 2 Notification',
        message: 'Private message for User 2',
        type: 'GENERAL'
      }
    ]);
  });

  it('should only retrieve notifications for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(2);
    expect(res.body.data.unreadCount).toBe(2);
  });

  it('should mark single notification as read', async () => {
    const notif = await Notification.findOne({ userId: user1._id, read: false });

    const res = await request(app)
      .put(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notification.read).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);

    const remainingUnread = await Notification.countDocuments({ userId: user1._id, read: false });
    expect(remainingUnread).toBe(0);
  });
});
