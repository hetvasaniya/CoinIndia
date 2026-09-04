const welcomeEmail = (name) => `
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
