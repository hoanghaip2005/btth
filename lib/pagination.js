function normalizePagination(page, limit) {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    offset: (normalizedPage - 1) * normalizedLimit
  };
}

function pageInfo(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit)
  };
}

module.exports = {
  normalizePagination,
  pageInfo
};
