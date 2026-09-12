/**
 * Standard API Response Formatter
 */

function success(res, data = null, message = 'Operation successful', statusCode = 200, meta = null) {
  const response = {
    success: true,
    statusCode,
    message,
    data
  };
  if (meta) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
}

function paginated(res, data = [], total = 0, page = 1, limit = 20, message = 'Data retrieved successfully') {
  const totalPages = Math.ceil(total / limit) || 1;
  return res.status(200).json({
    success: true,
    statusCode: 200,
    message,
    count: data.length,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
    data
  });
}

function error(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const response = {
    success: false,
    statusCode,
    message
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
}

module.exports = {
  success,
  paginated,
  error
};
