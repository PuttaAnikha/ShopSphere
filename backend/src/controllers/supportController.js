const SupportTicket = require('../models/SupportTicket');
const notificationService = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');

const createTicket = async (req, res, next) => {
  try {
    const { subject, description, orderId, priority } = req.body;
    if (!subject || !description) {
      return errorResponse(res, 400, 'Subject and description are required');
    }

    const ticket = await SupportTicket.create({
      customerId: req.user._id,
      subject,
      description,
      orderId: orderId || null,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      messages: [
        {
          senderId: req.user._id,
          senderRole: req.user.role,
          message: description
        }
      ]
    });

    return successResponse(res, 201, 'Support ticket created successfully', { ticket });
  } catch (error) {
    next(error);
  }
};

const getTickets = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, priority } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Role-based scoping
    if (req.user.role === 'CUSTOMER') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'SUPPORT_AGENT') {
      // Support agents can see all or assigned tickets
      if (req.query.assignedToMe === 'true') {
        query.assignedAgentId = req.user._id;
      }
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('customerId', 'name email phone')
        .populate('assignedAgentId', 'name email')
        .populate('orderId', 'orderNumber totalAmount')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      SupportTicket.countDocuments(query)
    ]);

    return successResponse(
      res,
      200,
      'Support tickets retrieved successfully',
      formatPaginatedResponse(tickets, total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const getTicketById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('assignedAgentId', 'name email')
      .populate('messages.senderId', 'name role avatar')
      .populate('orderId', 'orderNumber totalAmount');

    if (!ticket) {
      return errorResponse(res, 404, 'Support ticket not found');
    }

    // Customer can only view own ticket
    if (
      req.user.role === 'CUSTOMER' &&
      ticket.customerId._id.toString() !== req.user._id.toString()
    ) {
      return errorResponse(res, 403, 'Forbidden: You can only view your own support tickets');
    }

    return successResponse(res, 200, 'Support ticket retrieved successfully', { ticket });
  } catch (error) {
    next(error);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return errorResponse(res, 404, 'Support ticket not found');
    }

    const { status, priority, assignedAgentId } = req.body;

    // Only Admin or Support Agent can reassign or change priority/status arbitrarily
    if (!['ADMIN', 'SUPPORT_AGENT'].includes(req.user.role)) {
      // Customer can only close their own ticket
      if (ticket.customerId.toString() === req.user._id.toString() && status === 'CLOSED') {
        ticket.status = 'CLOSED';
        await ticket.save();
        return successResponse(res, 200, 'Ticket closed successfully', { ticket });
      }
      return errorResponse(res, 403, 'Forbidden: Unauthorized to update this ticket');
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedAgentId !== undefined) ticket.assignedAgentId = assignedAgentId || null;

    await ticket.save();

    // Notify customer
    await notificationService.send({
      userId: ticket.customerId,
      title: 'Support Ticket Update',
      message: `Your support ticket #${ticket._id.toString().slice(-6)} status is now ${ticket.status}.`,
      type: 'SUPPORT_TICKET_UPDATED',
      relatedEntity: 'SupportTicket',
      relatedEntityId: ticket._id
    });

    return successResponse(res, 200, 'Support ticket updated successfully', { ticket });
  } catch (error) {
    next(error);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return errorResponse(res, 400, 'Message cannot be empty');
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return errorResponse(res, 404, 'Support ticket not found');
    }

    // Role check
    const isCustomerOwner = ticket.customerId.toString() === req.user._id.toString();
    const isStaff = ['ADMIN', 'SUPPORT_AGENT'].includes(req.user.role);

    if (!isCustomerOwner && !isStaff) {
      return errorResponse(res, 403, 'Forbidden: You cannot reply to this ticket');
    }

    ticket.messages.push({
      senderId: req.user._id,
      senderRole: req.user.role,
      message: message.trim()
    });

    // Auto-update ticket status
    if (isCustomerOwner && ticket.status === 'WAITING_FOR_CUSTOMER') {
      ticket.status = 'IN_PROGRESS';
    } else if (isStaff && ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();

    return successResponse(res, 200, 'Message added successfully', { ticket });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addMessage
};
