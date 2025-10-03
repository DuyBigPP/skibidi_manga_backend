/**
 * Custom Error Class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Prisma Error Handling
  if (err.code === 'P2002') {
    err.message = `Duplicate field value: ${err.meta?.target}`;
    err.statusCode = 400;
  }

  if (err.code === 'P2025') {
    err.message = 'Record not found';
    err.statusCode = 404;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    err.message = 'Invalid token. Please login again.';
    err.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    err.message = 'Token expired. Please login again.';
    err.statusCode = 401;
  }

  // Validation Errors
  if (err.name === 'ValidationError') {
    err.message = Object.values(err.errors).map(e => e.message).join(', ');
    err.statusCode = 400;
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Not Found Handler
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

module.exports = { AppError, errorHandler, notFound };

