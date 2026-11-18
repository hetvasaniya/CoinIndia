const baseTemplate = require('./baseTemplate');

/**
 * Welcome Email Template (Post Verification)
 */
const welcomeEmail = ({ name, loginUrl }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const targetLoginUrl = loginUrl || `${frontendUrl}/login`;

  const content = `
    <div style="font-size: 16px; line-height: 24px; color: #1F2937;">
      <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827; font-family: 'Cinzel', Georgia, serif;">
        Welcome to Coinomart 🎉
      </h2>
      <p style="margin: 0 0 16px 0;">
        Hello <strong>${name || 'Collector'}</strong>,
      </p>
      <p style="margin: 0 0 16px 0; color: #4B5563;">
        Your email address has been verified and your Coinomart account is now active! You are officially part of India's premier numismatic marketplace.
      </p>

      <div style="background-color: #F3F4F6; border-left: 4px solid #D4AF37; padding: 16px; border-radius: 6px; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #111827;">What you can do now:</p>
        <ul style="margin: 0; padding-left: 20px; color: #4B5563; font-size: 14px; line-height: 22px;">
          <li>Explore rare ancient, medieval, Mughal, and colonial coins</li>
          <li>Save prized specimens to your personal wishlist</li>
          <li>Enjoy secure, certified checkout and insured transit</li>
          <li>Track your orders and certificate of authenticity records</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
        <tr>
          <td align="center">
            <a href="${targetLoginUrl}" target="_blank" style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #111827; font-weight: 700; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.35);">
              Explore Coinomart
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6B7280; text-align: center;">
        Direct link: <a href="${targetLoginUrl}" style="color: #B8860B; text-decoration: underline;">${targetLoginUrl}</a>
      </p>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #374151; border-top: 1px solid #E5E7EB; padding-top: 16px;">
        Warm regards,<br>
        <strong>The Coinomart Team</strong>
      </p>
    </div>
  `;

  return baseTemplate({
    title: 'Welcome to Coinomart 🎉',
    preheader: 'Your Coinomart account is ready. Start exploring rare and certified coins today.',
    content,
  });
};

module.exports = welcomeEmail;
