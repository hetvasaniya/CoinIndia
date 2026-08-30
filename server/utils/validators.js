const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const errorMessage = errors.array().map(e => e.msg).join('. ');
  res.status(400).json({ message: errorMessage, errors: errors.array() });
};

const registerValidation = [
  body('name', 'Name is required').trim().notEmpty(),
  body('email', 'Please include a valid email address').trim().isEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
];

const loginValidation = [
  body('email', 'Please include a valid email address').trim().isEmail(),
  body('password', 'Password is required').exists(),
];

module.exports = { validate, registerValidation, loginValidation };

