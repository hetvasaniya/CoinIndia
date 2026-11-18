const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendEmail } = require('../services/emailService');
const {
  verificationEmail,
  welcomeEmail,
  loginNotificationEmail,
  forgotPasswordEmail,
  passwordChangedEmail,
} = require('../templates/email');

/**
 * Register a new user and dispatch 6-digit OTP email
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // If user already exists and is email-verified, reject registration
      if (user.isEmailVerified) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }

      // Check resend cooldown for unverified user (60 seconds)
      const lastSent = user.verificationOtpLastSentAt ? user.verificationOtpLastSentAt.getTime() : 0;
      const cooldownRemaining = Math.ceil((60000 - (Date.now() - lastSent)) / 1000);
      if (cooldownRemaining > 0) {
        return res.status(429).json({
          message: `A verification code was recently sent. Please wait ${cooldownRemaining}s before retrying.`,
          cooldown: cooldownRemaining,
          email: user.email,
        });
      }

      // Update existing unverified account credentials
      user.name = name ? name.trim() : user.name;
      user.password = password; // pre-save hook will re-hash
      if (phone !== undefined) user.phone = phone;
    } else {
      // Create new user document in unverified state
      user = new User({
        name: name ? name.trim() : '',
        email: normalizedEmail,
        password,
        phone,
        isEmailVerified: false,
      });
    }

    // Generate 6-digit cryptographic OTP and save expiration
    const otp = user.generateVerificationOtp();
    await user.save();

    // Dispatch verification email via Mailjet asynchronously
    sendEmail({
      to: user.email,
      toName: user.name,
      subject: 'Verify your Coinomart account',
      html: verificationEmail({
        name: user.name,
        otp,
        expiresIn: '10 minutes',
      }),
    }).catch((err) => {
      console.error('[Registration] Failed to send verification email:', err.message);
    });

    return res.status(201).json({
      message: 'Registration initiated. Verification OTP sent to your email.',
      email: user.email,
      isEmailVerified: false,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

/**
 * Verify 6-digit OTP and complete account registration
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!normalizedEmail || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit verification code are required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'No user account found with this email' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Account is already verified. Please sign in.' });
    }

    if (!user.verificationOtpHash || !user.verificationOtpExpiresAt) {
      return res.status(400).json({ message: 'No active verification code found. Please request a new code.' });
    }

    // Check expiration
    if (new Date() > new Date(user.verificationOtpExpiresAt)) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    // Check max attempts (limit 5)
    if (user.verificationOtpAttempts >= 5) {
      user.verificationOtpHash = undefined;
      user.verificationOtpExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({
        message: 'Maximum verification attempts exceeded. Please request a new code.',
      });
    }

    // Verify hashed OTP
    const hashedOtp = crypto
      .createHash('sha256')
      .update(String(otp).trim())
      .digest('hex');

    if (hashedOtp !== user.verificationOtpHash) {
      user.verificationOtpAttempts = (user.verificationOtpAttempts || 0) + 1;
      await user.save({ validateBeforeSave: false });
      const remainingAttempts = Math.max(0, 5 - user.verificationOtpAttempts);
      return res.status(400).json({
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
      });
    }

    // Mark user as verified and clear OTP
    user.isEmailVerified = true;
    user.verificationOtpHash = undefined;
    user.verificationOtpExpiresAt = undefined;
    user.verificationOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    // Generate JWT token & set cookie
    const token = generateToken(res, user._id);

    // Send welcome email via Mailjet
    sendEmail({
      to: user.email,
      toName: user.name,
      subject: 'Welcome to Coinomart 🎉',
      html: welcomeEmail({
        name: user.name,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
      }),
    }).catch((err) => {
      console.error('[Verify OTP] Failed to send welcome email:', err.message);
    });

    return res.status(200).json({
      message: 'Email verified successfully',
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      addresses: user.addresses,
      token,
      isEmailVerified: true,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: error.message || 'Server error during OTP verification' });
  }
};

/**
 * Resend verification OTP with 60-second cooldown
 * POST /api/auth/resend-verification
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified. Please sign in.' });
    }

    // Check 60s cooldown
    const lastSent = user.verificationOtpLastSentAt ? user.verificationOtpLastSentAt.getTime() : 0;
    const timeSinceLastSent = Date.now() - lastSent;
    const cooldownDuration = 60000;

    if (timeSinceLastSent < cooldownDuration) {
      const remainingSeconds = Math.ceil((cooldownDuration - timeSinceLastSent) / 1000);
      return res.status(429).json({
        message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        cooldown: remainingSeconds,
      });
    }

    // Generate new OTP and reset attempts
    const otp = user.generateVerificationOtp();
    await user.save({ validateBeforeSave: false });

    // Send new OTP email via Mailjet
    sendEmail({
      to: user.email,
      toName: user.name,
      subject: 'Verify your Coinomart account',
      html: verificationEmail({
        name: user.name,
        otp,
        expiresIn: '10 minutes',
      }),
    }).catch((err) => {
      console.error('[Resend OTP] Failed to send verification email:', err.message);
    });

    return res.status(200).json({
      message: 'A new verification code has been sent to your email.',
      email: user.email,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: error.message || 'Server error during OTP resend' });
  }
};

/**
 * User login with unverified guard & login security email notification
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await user.matchPassword(password))) {
      // Check if email verification is required (ignore for legacy accounts where isEmailVerified is undefined or true)
      if (user.isEmailVerified === false && user.role !== 'admin') {
        return res.status(403).json({
          message: 'Your email is not verified. Please verify your email before logging in.',
          isEmailVerified: false,
          email: user.email,
        });
      }

      const token = generateToken(res, user._id);

      // Dispatch login notification email asynchronously
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
      const userAgent = req.headers['user-agent'] || 'Web Browser';

      sendEmail({
        to: user.email,
        toName: user.name,
        subject: 'New login to your Coinomart account',
        html: loginNotificationEmail({
          name: user.name,
          loginTime: new Date().toUTCString(),
          ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '',
          userAgent: userAgent.length > 80 ? userAgent.substring(0, 80) + '...' : userAgent,
        }),
      }).catch((err) => {
        console.error('[Login Notification] Failed to send login email:', err.message);
      });

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses,
        token,
        isEmailVerified: user.isEmailVerified ?? true,
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

/**
 * Logout user by clearing JWT cookie
 * POST /api/auth/logout
 */
const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production' ||
    (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https'));

  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Forgot password request with Anti-Enumeration generic response
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    const genericResponse = {
      message: 'If an account exists with this email, a password reset link has been sent.',
    };

    if (!normalizedEmail) {
      return res.status(200).json(genericResponse);
    }

    const user = await User.findOne({ email: normalizedEmail });

    // Anti-enumeration: Return generic response without revealing email existence
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        toName: user.name,
        subject: 'Reset your Coinomart password',
        html: forgotPasswordEmail({
          name: user.name,
          resetUrl,
          expiresIn: '15 minutes',
        }),
      });
    } catch (err) {
      console.error('[Forgot Password] Mailjet email dispatch failed:', err.message);
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: 'Unable to send password reset email. Please try again later.' });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message || 'Server error processing request' });
  }
};

/**
 * Reset password using secure token (accepts token via body or param)
 * POST /api/auth/reset-password
 * POST /api/auth/reset-password/:token
 */
const resetPassword = async (req, res) => {
  try {
    const token = req.body.token || req.params.token;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(String(token).trim())
      .digest('hex');

    const now = new Date();
    const user = await User.findOne({
      $or: [
        { passwordResetTokenHash: hashedToken, passwordResetExpiresAt: { $gt: now } },
        { resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: now } },
      ],
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset link. Please request a new one.' });
    }

    // Set new password (pre-save hook will hash it)
    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.isEmailVerified = true; // password reset confirms email ownership
    await user.save();

    // Send confirmation email asynchronously
    sendEmail({
      to: user.email,
      toName: user.name,
      subject: 'Your Coinomart password was changed',
      html: passwordChangedEmail({
        name: user.name,
        changeTime: new Date().toUTCString(),
      }),
    }).catch((err) => {
      console.error('[Password Reset Confirmation] Email dispatch failed:', err.message);
    });

    return res.status(200).json({
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Server error resetting password' });
  }
};

/**
 * Update authenticated user profile
 * PUT /api/auth/update-profile
 */
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.phone !== undefined) user.phone = req.body.phone;
      if (req.body.addresses) {
        user.addresses = req.body.addresses;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        addresses: updatedUser.addresses,
        isEmailVerified: updatedUser.isEmailVerified,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Change password for authenticated user
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(req.body.oldPassword))) {
      user.password = req.body.newPassword;
      await user.save();

      // Send password changed notification
      sendEmail({
        to: user.email,
        toName: user.name,
        subject: 'Your Coinomart password was changed',
        html: passwordChangedEmail({
          name: user.name,
          changeTime: new Date().toUTCString(),
        }),
      }).catch((err) => {
        console.error('[Change Password] Notification email failed:', err.message);
      });

      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
