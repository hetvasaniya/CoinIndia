const baseTemplate = require('./baseTemplate');

/**
 * 6-Digit OTP Email Verification Template
 */
const verificationEmail = ({ name, otp, expiresIn = '10 minutes' }) => {
  const content = `
    <div style="font-size: 16px; line-height: 24px; color: #1F2937;">
      <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827; font-family: 'Cinzel', Georgia, serif;">
        Verify Your Email Address
      </h2>
      <p style="margin: 0 0 16px 0;">
        Hello <strong>${name || 'Valued Collector'}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; color: #4B5563;">
        Welcome to <strong>Coinomart</strong>! Thank you for registering. Please use the following 6-digit verification code to complete your registration and activate your account:
      </p>

      <!-- OTP Code Box -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
        <tr>
          <td align="center">
            <div style="background: #FDFBF7; border: 2px dashed #D4AF37; border-radius: 12px; padding: 20px 32px; display: inline-block; text-align: center;">
              <span style="font-size: 13px; font-weight: 600; color: #856404; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                Verification Code
              </span>
              <span style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 36px; font-weight: 800; color: #111827; letter-spacing: 8px; display: block;">
                ${otp}
              </span>
            </div>
          </td>
        </tr>
      </table>

      <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 14px 16px; border-radius: 6px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400E; line-height: 20px;">
          ⏱️ <strong>Time sensitive:</strong> This code expires in <strong>${expiresIn}</strong>.
        </p>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #4B5563;">
        Enter this verification code on the Coinomart verification page to verify your email.
      </p>

      <p style="margin: 0 0 16px 0; font-size: 13px; color: #DC2626; font-weight: 500;">
        🔒 <strong>Security Warning:</strong> Never share this verification code with anyone. Coinomart employees will never ask for your code.
      </p>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 16px;">
        If you did not initiate this registration request, you can safely ignore this email.
      </p>

      <p style="margin: 16px 0 0 0; font-size: 14px; color: #374151;">
        Warm regards,<br>
        <strong>The Coinomart Team</strong>
      </p>
    </div>
  `;

  return baseTemplate({
    title: 'Verify your Coinomart account',
    preheader: `Your Coinomart verification code is ${otp}. Valid for ${expiresIn}.`,
    content,
  });
};

module.exports = verificationEmail;
