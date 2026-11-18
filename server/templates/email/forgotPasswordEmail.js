const baseTemplate = require('./baseTemplate');

/**
 * Forgot Password Reset Link Email Template
 */
const forgotPasswordEmail = ({ name, resetUrl, expiresIn = '15 minutes' }) => {
  const content = `
    <div style="font-size: 16px; line-height: 24px; color: #1F2937;">
      <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827; font-family: 'Cinzel', Georgia, serif;">
        Reset Your Password
      </h2>
      <p style="margin: 0 0 16px 0;">
        Hello <strong>${name || 'Valued Collector'}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; color: #4B5563;">
        We received a request to reset the password for your Coinomart account. Click the button below to choose a new password:
      </p>

      <!-- CTA Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
        <tr>
          <td align="center">
            <a href="${resetUrl}" target="_blank" style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #111827; font-weight: 700; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.35);">
              Reset Password
            </a>
          </td>
        </tr>
      </table>

      <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 20px;">
          ⏱️ <strong>Note:</strong> This link is valid for <strong>${expiresIn}</strong> and can only be used once.
        </p>
      </div>

      <p style="margin: 0 0 8px 0; font-size: 13px; color: #6B7280;">
        If the button above does not work, copy and paste this URL into your browser:
      </p>
      <p style="margin: 0 0 20px 0; font-size: 12px; color: #4B5563; word-break: break-all; background-color: #F3F4F6; padding: 10px; border-radius: 6px;">
        <a href="${resetUrl}" style="color: #B8860B; text-decoration: underline;">${resetUrl}</a>
      </p>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 16px;">
        If you did not request a password reset, please ignore this email or reach out to our support team if you suspect unauthorized activity. Your password will remain unchanged.
      </p>

      <p style="margin: 16px 0 0 0; font-size: 14px; color: #374151;">
        Regards,<br>
        <strong>Coinomart Security Team</strong>
      </p>
    </div>
  `;

  return baseTemplate({
    title: 'Reset your Coinomart password',
    preheader: `We received a request to reset your Coinomart password. Valid for ${expiresIn}.`,
    content,
  });
};

module.exports = forgotPasswordEmail;
