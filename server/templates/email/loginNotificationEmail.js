const baseTemplate = require('./baseTemplate');

/**
 * Login Notification Email Template
 */
const loginNotificationEmail = ({ name, loginTime, ipAddress, userAgent }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/forgot-password`;
  const formattedTime = loginTime || new Date().toUTCString();

  const content = `
    <div style="font-size: 16px; line-height: 24px; color: #1F2937;">
      <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827; font-family: 'Cinzel', Georgia, serif;">
        New Login to Your Account
      </h2>
      <p style="margin: 0 0 16px 0;">
        Hello <strong>${name || 'Collector'}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; color: #4B5563;">
        Your Coinomart account was just accessed with a successful login.
      </p>

      <!-- Activity Details Card -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; margin: 20px 0; padding: 16px;">
        <tr>
          <td>
            <table border="0" cellpadding="4" cellspacing="0" width="100%" style="font-size: 14px; color: #4B5563;">
              <tr>
                <td style="font-weight: 600; width: 110px; color: #374151;">Timestamp:</td>
                <td>${formattedTime}</td>
              </tr>
              ${ipAddress ? `
              <tr>
                <td style="font-weight: 600; color: #374151;">IP Address:</td>
                <td><code>${ipAddress}</code></td>
              </tr>
              ` : ''}
              ${userAgent ? `
              <tr>
                <td style="font-weight: 600; color: #374151;">Device:</td>
                <td>${userAgent}</td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>

      <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 20px;">
          ✓ <strong>Recognize this activity?</strong> If this was you, no further action is required.
        </p>
      </div>

      <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #991B1B;">
          ⚠️ Don't recognize this login?
        </p>
        <p style="margin: 0; font-size: 13px; color: #B91C1C; line-height: 18px;">
          If you did not initiate this login, your account might be compromised. Please reset your password immediately to protect your account.
        </p>
        <div style="margin-top: 12px;">
          <a href="${resetUrl}" target="_blank" style="background-color: #DC2626; color: #FFFFFF; font-weight: 600; font-size: 13px; text-decoration: none; padding: 8px 18px; border-radius: 6px; display: inline-block;">
            Reset Password Now
          </a>
        </div>
      </div>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #374151; border-top: 1px solid #E5E7EB; padding-top: 16px;">
        Regards,<br>
        <strong>Coinomart Security Team</strong>
      </p>
    </div>
  `;

  return baseTemplate({
    title: 'New login to your Coinomart account',
    preheader: `Login notification for your Coinomart account at ${formattedTime}`,
    content,
  });
};

module.exports = loginNotificationEmail;
