/**
 * Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry', details: err.detail });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Reference error' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

module.exports = { errorHandler, notFoundHandler };
