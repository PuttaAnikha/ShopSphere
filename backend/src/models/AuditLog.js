const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    role: {
      type: String,
      default: 'SYSTEM'
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    entityType: {
      type: String,
      required: true,
      trim: true
    },
    entityId: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
