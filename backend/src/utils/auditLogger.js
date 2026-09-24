const mongoose = require('mongoose');

/**
 * Log actions to AuditLog collection asynchronously
 */
const logAudit = async ({
  userId,
  role,
  action,
  entityType,
  entityId,
  oldValue = null,
  newValue = null,
  ipAddress = null
}) => {
  try {
    const AuditLog = mongoose.model('AuditLog');
    await AuditLog.create({
      userId,
      role,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress
    });
  } catch (err) {
    // Audit logging should never crash the main operation, but log error to console
    console.error(`[AuditLogger Error]: ${err.message}`);
  }
};

module.exports = { logAudit };
