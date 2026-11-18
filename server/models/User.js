const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    addresses: [
      {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    avatar: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationOtpHash: {
      type: String,
    },
    verificationOtpExpiresAt: {
      type: Date,
    },
    verificationOtpAttempts: {
      type: Number,
      default: 0,
    },
    verificationOtpLastSentAt: {
      type: Date,
    },
    passwordResetTokenHash: {
      type: String,
    },
    passwordResetExpiresAt: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateVerificationOtp = function () {
  const otp = crypto.randomInt(100000, 1000000).toString();
  this.verificationOtpHash = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  this.verificationOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.verificationOtpAttempts = 0;
  this.verificationOtpLastSentAt = new Date();
  return otp;
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetTokenHash = hashedToken;
  this.resetPasswordToken = hashedToken; // for backwards compatibility

  const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  this.passwordResetExpiresAt = expireTime;
  this.resetPasswordExpire = expireTime;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
