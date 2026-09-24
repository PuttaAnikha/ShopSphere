export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (date, options = {}) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const timeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

export const getApiError = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors.map((e) => e.msg || e).join(', ');
  }
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};

export const getDiscountedPrice = (price, discount) => {
  if (!discount || discount === 0) return price;
  return price - (price * discount) / 100;
};

export const getStockStatus = (stock) => {
  if (stock === 0) return { label: 'Out of Stock', class: 'badge-danger' };
  if (stock <= 5) return { label: 'Low Stock', class: 'badge-warning' };
  return { label: 'In Stock', class: 'badge-success' };
};

export const truncate = (str, maxLen = 60) => {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
};
