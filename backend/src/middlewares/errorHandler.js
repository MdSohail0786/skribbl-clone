const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  // eslint-disable-next-line no-console
  console.error('[error]', err);
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
