const { validationResult } = require('express-validator');
const { AppError } = require('./error.middleware');

/**
 * Validate request using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
    }));

    return next(new AppError(JSON.stringify(errorMessages), 400));
  }

  next();
};

module.exports = validate;

