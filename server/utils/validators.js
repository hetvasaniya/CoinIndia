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
  body('name', 'Name must be at least 2 characters').trim().isLength({ min: 2 }),
  body('email', 'Please include a valid email address').trim().isEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
];

const loginValidation = [
  body('email', 'Please include a valid email address').trim().isEmail(),
  body('password', 'Password is required').notEmpty(),
];

const forgotPasswordValidation = [
  body('email', 'Please include a valid email address').trim().isEmail(),
];

const resetPasswordValidation = [
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
];

const updateProfileValidation = [
  body('name', 'Name must be at least 2 characters').optional().trim().isLength({ min: 2 }),
  body('phone', 'Phone must be a valid phone number').optional().trim(),
];

const changePasswordValidation = [
  body('oldPassword', 'Old password is required').notEmpty(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 }),
];

const createInquiryValidation = [
  body('name', 'Name is required').trim().notEmpty(),
  body('email', 'Please include a valid email address').trim().isEmail(),
  body('subject', 'Subject must be at least 3 characters').trim().isLength({ min: 3 }),
  body('message', 'Message must be at least 10 characters').trim().isLength({ min: 10 }),
];

const createReviewValidation = [
  body('name', 'Name is required').trim().notEmpty(),
  body('rating', 'Rating must be an integer between 1 and 5').isInt({ min: 1, max: 5 }),
  body('title', 'Review headline must be at least 3 characters').trim().isLength({ min: 3 }),
  body('comment', 'Comment must be at least 10 characters').trim().isLength({ min: 10 }),
  body('email', 'Please provide a valid email address').optional({ checkFalsy: true }).trim().isEmail(),
];

const createOrderValidation = [
  body('items', 'Order items are required and must be an array').isArray({ min: 1 }),
  body('shippingAddress.street', 'Shipping street address is required').trim().notEmpty(),
  body('shippingAddress.city', 'Shipping city is required').trim().notEmpty(),
  body('shippingAddress.state', 'Shipping state is required').trim().notEmpty(),
  body('shippingAddress.zipCode', 'Shipping PIN/Zip code is required').trim().notEmpty(),
  body('shippingAddress.phone', 'Shipping contact phone is required').trim().notEmpty(),
];

const verifyOtpValidation = [
  body('email', 'Please include a valid email address').trim().isEmail(),
  body('otp', 'Verification code must be a 6-digit number').trim().isLength({ min: 6, max: 6 }).isNumeric(),
];

const resendVerificationValidation = [
  body('email', 'Please include a valid email address').trim().isEmail(),
];

module.exports = { 
  validate, 
  registerValidation, 
  loginValidation,
  verifyOtpValidation,
  resendVerificationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
  changePasswordValidation,
  createInquiryValidation,
  createReviewValidation,
  createOrderValidation
};

