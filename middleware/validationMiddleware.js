const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    if (!validations || !Array.isArray(validations)) {
      return next();
    }
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req).formatWith(error => {
      if (error.type === 'field') {
        return {
          ...error,
          value: req.body[error.path], 
        };
      }
      return error;
    });

    if (errors.isEmpty()) {
      const sanitizedBody = {};
      for (const field in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          sanitizedBody[field] = req.body[field];
        }
      }
      req.body = sanitizedBody;
      return next();
    }

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
