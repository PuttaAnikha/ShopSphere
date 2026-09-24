/**
 * Pagination helper utility
 */

const getPagination = (query, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let limit = Math.max(1, parseInt(query.limit, 10) || defaultLimit);
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const formatPaginatedResponse = (docs, total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    items: docs,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  getPagination,
  formatPaginatedResponse
};
