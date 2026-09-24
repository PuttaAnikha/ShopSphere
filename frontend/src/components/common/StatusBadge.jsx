const STATUS_CONFIG = {
  // Order statuses
  PLACED: { label: 'Placed', class: 'badge-info' },
  CONFIRMED: { label: 'Confirmed', class: 'badge-purple' },
  PACKED: { label: 'Packed', class: 'badge-warning' },
  SHIPPED: { label: 'Shipped', class: 'badge-warning' },
  DELIVERED: { label: 'Delivered', class: 'badge-success' },
  CANCELLED: { label: 'Cancelled', class: 'badge-danger' },
  RETURNED: { label: 'Returned', class: 'badge-neutral' },
  REFUNDED: { label: 'Refunded', class: 'badge-neutral' },
  // User statuses
  ACTIVE: { label: 'Active', class: 'badge-success' },
  INACTIVE: { label: 'Inactive', class: 'badge-neutral' },
  SUSPENDED: { label: 'Suspended', class: 'badge-danger' },
  // Seller approval
  PENDING: { label: 'Pending', class: 'badge-warning' },
  APPROVED: { label: 'Approved', class: 'badge-success' },
  REJECTED: { label: 'Rejected', class: 'badge-danger' },
  // Payment
  SUCCESSFUL: { label: 'Payment Successful', class: 'badge-success' },
  PAID: { label: 'Payment Successful', class: 'badge-success' },
  FAILED: { label: 'Failed', class: 'badge-danger' },
  // Product statuses
  OUT_OF_STOCK: { label: 'Out of Stock', class: 'badge-danger' },
  // Ticket statuses
  OPEN: { label: 'Open', class: 'badge-info' },
  IN_PROGRESS: { label: 'In Progress', class: 'badge-warning' },
  WAITING_FOR_CUSTOMER: { label: 'Waiting', class: 'badge-neutral' },
  RESOLVED: { label: 'Resolved', class: 'badge-success' },
  CLOSED: { label: 'Closed', class: 'badge-neutral' },
  // Delivery statuses
  ASSIGNED: { label: 'Assigned', class: 'badge-info' },
  PICKED_UP: { label: 'Picked Up', class: 'badge-warning' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', class: 'badge-purple' },
  // Dispute statuses
  UNDER_REVIEW: { label: 'Under Review', class: 'badge-warning' },
  // Processing
  PROCESSING: { label: 'Processing', class: 'badge-warning' },
  COMPLETED: { label: 'Completed', class: 'badge-success' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status || 'Unknown', class: 'badge-neutral' };
  return <span className={`badge ${config.class}`}>{config.label}</span>;
};

export default StatusBadge;
