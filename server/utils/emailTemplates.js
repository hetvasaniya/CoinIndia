const emailTemplates = require('../templates/email');

// Wrap templates to support both legacy positional arguments and structured object arguments
const welcomeEmail = (arg) => {
  if (typeof arg === 'string') {
    return emailTemplates.welcomeEmail({ name: arg });
  }
  return emailTemplates.welcomeEmail(arg || {});
};

const forgotPasswordEmail = (arg) => {
  if (typeof arg === 'string') {
    return emailTemplates.forgotPasswordEmail({ resetUrl: arg });
  }
  return emailTemplates.forgotPasswordEmail(arg || {});
};

const orderConfirmationEmail = (orderNumber, name, totalAmount) => {
  if (typeof orderNumber === 'object') {
    return emailTemplates.orderConfirmationEmail(
      orderNumber.orderNumber,
      orderNumber.name,
      orderNumber.totalAmount
    );
  }
  return emailTemplates.orderConfirmationEmail(orderNumber, name, totalAmount);
};

module.exports = {
  ...emailTemplates,
  welcomeEmail,
  forgotPasswordEmail,
  orderConfirmationEmail,
};
