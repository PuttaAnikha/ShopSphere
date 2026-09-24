const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const supportTicketSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'],
      default: 'OPEN'
    },
    messages: [ticketMessageSchema]
  },
  {
    timestamps: true
  }
);

supportTicketSchema.index({ customerId: 1, status: 1 });
supportTicketSchema.index({ assignedAgentId: 1, status: 1 });
supportTicketSchema.index({ orderId: 1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
module.exports = SupportTicket;
