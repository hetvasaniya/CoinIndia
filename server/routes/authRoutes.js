const express = require('express');
const router = express.Router();
const {
  register,
  verifyOtp,
  resendVerification,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} = require('../middleware/rateLimiter');
const {
  validate,
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  resendVerificationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
  changePasswordValidation,
} = require('../utils/validators');

// Registration & Verification
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/verify-otp', otpLimiter, verifyOtpValidation, validate, verifyOtp);
router.post('/resend-verification', otpLimiter, resendVerificationValidation, validate, resendVerification);

// Authentication
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// Password Management
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, validate, resetPassword);
router.post('/reset-password/:token', passwordResetLimiter, resetPasswordValidation, validate, resetPassword);
router.put('/reset-password/:token', passwordResetLimiter, resetPasswordValidation, validate, resetPassword); // backward compatibility

// Profile Management
router.put('/update-profile', protect, updateProfileValidation, validate, updateProfile);
router.put('/change-password', protect, changePasswordValidation, validate, changePassword);

module.exports = router;
