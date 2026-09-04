const transporter = require('../config/email');

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('Skipping email send: SMTP credentials not configured in environment variables.');
    return;
  }

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Coinomart'}" <${process.env.FROM_EMAIL || 'noreply@coinomart.com'}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
