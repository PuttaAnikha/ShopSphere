const request = require('supertest');
const app = require('../src/app');
const SupportTicket = require('../src/models/SupportTicket');
const { createTestUser } = require('./helpers');

describe('Customer Support Tickets Management Tests', () => {
  let customer, customerToken;
  let otherCustomer, otherCustomerToken;
  let supportAgent, supportAgentToken;

  beforeEach(async () => {
    const c = await createTestUser({ role: 'CUSTOMER' });
    customer = c.user;
    customerToken = c.token;

    const oc = await createTestUser({ role: 'CUSTOMER' });
    otherCustomer = oc.user;
    otherCustomerToken = oc.token;

    const sa = await createTestUser({ role: 'SUPPORT_AGENT' });
    supportAgent = sa.user;
    supportAgentToken = sa.token;
  });

  it('should allow customer to create a support ticket', async () => {
    const res = await request(app)
      .post('/api/support/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        subject: 'Defective charger',
        description: 'The charger does not power on',
        priority: 'HIGH'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket.subject).toBe('Defective charger');
    expect(res.body.data.ticket.status).toBe('OPEN');
    expect(res.body.data.ticket.messages.length).toBe(1);
  });

  it('should allow support agent to view tickets and update status', async () => {
    const ticket = await SupportTicket.create({
      customerId: customer._id,
      subject: 'Inquiry',
      description: 'Where is my tracking number?',
      status: 'OPEN'
    });

    const updateRes = await request(app)
      .put(`/api/support/tickets/${ticket._id}`)
      .set('Authorization', `Bearer ${supportAgentToken}`)
      .send({
        status: 'IN_PROGRESS',
        assignedAgentId: supportAgent._id.toString()
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.ticket.status).toBe('IN_PROGRESS');
  });

  it('should allow message replies on support ticket', async () => {
    const ticket = await SupportTicket.create({
      customerId: customer._id,
      subject: 'Question',
      description: 'Initial inquiry',
      status: 'OPEN'
    });

    const replyRes = await request(app)
      .post(`/api/support/tickets/${ticket._id}/messages`)
      .set('Authorization', `Bearer ${supportAgentToken}`)
      .send({ message: 'Hello, we are looking into this right now.' });

    expect(replyRes.status).toBe(200);
    expect(replyRes.body.data.ticket.messages.length).toBe(1);
  });

  it('should forbid other customers from viewing another user’s ticket', async () => {
    const ticket = await SupportTicket.create({
      customerId: customer._id,
      subject: 'Confidential',
      description: 'Private customer data',
      status: 'OPEN'
    });

    const res = await request(app)
      .get(`/api/support/tickets/${ticket._id}`)
      .set('Authorization', `Bearer ${otherCustomerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
