const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req).formatWith(error => {
      if (error.type === 'field') {
        return {
          ...error,
          value: req.body[error.path], // Include the sanitized value
        };
      }
      return error;
    });

    if (errors.isEmpty()) {
      // Update request body with sanitized values
      const sanitizedBody = {};
      for (const field in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          sanitizedBody[field] = req.body[field];
        }
      }
      req.body = sanitizedBody;
      return next();
    }

    // Return a consistent error shape expected by frontend and tests.
    // Prefer an email validation error as the primary message when present
    const extracted = errors.array();
    const primary =
      extracted.find((e) => e.param === 'email') || extracted[0];

    res.status(400).json({
      status: 'error',
      message: primary.msg,
      errors: extracted,
    });
  };
};

module.exports = validate;
