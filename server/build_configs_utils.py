import os

base_dir = r"d:\code\PROJECTS\coinIndia\server"
dirs = ['config', 'utils', 'models', 'middleware', 'controllers', 'routes', 'seeds']
for d in dirs:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

files = {}

files['config/db.js'] = """const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
"""

files['config/cloudinary.js'] = """const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
"""

files['config/razorpay.js'] = """const Razorpay = require('razorpay');
const dotenv = require('dotenv');

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;
"""

files['config/email.js'] = """const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = transporter;
"""

files['utils/generateToken.js'] = """const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  
  return token;
};

module.exports = generateToken;
"""

files['utils/emailTemplates.js'] = """const welcomeEmail = (name) => `
  <h1>Welcome to Coinomart, ${name}!</h1>
  <p>We are thrilled to have you on board. Start exploring our collection of rare and historic coins today.</p>
`;

const forgotPasswordEmail = (resetUrl) => `
  <h1>Password Reset Request</h1>
  <p>You requested a password reset. Please click the link below to set a new password:</p>
  <a href="${resetUrl}">Reset Password</a>
  <p>If you did not request this, please ignore this email.</p>
  <p>This link will expire in 10 minutes.</p>
`;

const orderConfirmationEmail = (orderNumber, name, totalAmount) => `
  <h1>Order Confirmation</h1>
  <p>Dear ${name},</p>
  <p>Thank you for your order! Your order number is <strong>${orderNumber}</strong>.</p>
  <p>Total Amount: ₹${totalAmount}</p>
  <p>We will notify you once your order is shipped.</p>
`;

module.exports = { welcomeEmail, forgotPasswordEmail, orderConfirmationEmail };
"""

files['utils/sendEmail.js'] = """const transporter = require('../config/email');

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
"""

files['utils/validators.js'] = """const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

const registerValidation = [
  body('name', 'Name is required').notEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
];

const loginValidation = [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists(),
];

module.exports = { validate, registerValidation, loginValidation };
"""

for file_path, content in files.items():
    full_path = os.path.join(base_dir, file_path)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Configs and Utils created.")
