/**
 * Global Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  // Database errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          error: 'Duplicate entry',
          details: err.detail
        });
      case '23503': // foreign_key_violation
        return res.status(400).json({
          error: 'Reference error',
          details: 'Referenced record does not exist'
        });
      case '23502': // not_null_violation
        return res.status(400).json({
          error: 'Missing required field',
          details: err.column
        });
    }
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

module.exports = { errorHandler, notFoundHandler };
