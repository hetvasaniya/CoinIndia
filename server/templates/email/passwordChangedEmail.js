const baseTemplate = require('./baseTemplate');

/**
 * Password Changed Confirmation Email Template
 */
const passwordChangedEmail = ({ name, changeTime }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const supportUrl = `${frontendUrl}/support`;
  const formattedTime = changeTime || new Date().toUTCString();

  const content = `
    <div style="font-size: 16px; line-height: 24px; color: #1F2937;">
      <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827; font-family: 'Cinzel', Georgia, serif;">
        Password Successfully Changed
      </h2>
      <p style="margin: 0 0 16px 0;">
        Hello <strong>${name || 'Valued Collector'}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; color: #4B5563;">
        This email confirms that the password for your Coinomart account was successfully updated on <strong>${formattedTime}</strong>.
      </p>

      <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #065F46; line-height: 20px;">
          ✓ <strong>If you made this change</strong>, no further action is required.
        </p>
      </div>

      <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #991B1B;">
          ⚠️ Did not change your password?
        </p>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #B91C1C; line-height: 18px;">
          If you did not initiate this change, your account may have been accessed without your permission. Please contact our support team immediately.
        </p>
        <a href="${supportUrl}" target="_blank" style="background-color: #DC2626; color: #FFFFFF; font-weight: 600; font-size: 13px; text-decoration: none; padding: 8px 18px; border-radius: 6px; display: inline-block;">
          Contact Support Immediately
        </a>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #374151; border-top: 1px solid #E5E7EB; padding-top: 16px;">
        Regards,<br>
        <strong>Coinomart Security Team</strong>
      </p>
    </div>
  `;

  return baseTemplate({
    title: 'Your Coinomart password was changed',
    preheader: 'Your Coinomart password was successfully updated.',
    content,
  });
};

module.exports = passwordChangedEmail;
