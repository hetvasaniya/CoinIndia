const baseTemplate = require('./baseTemplate');

/**
 * Order Confirmation Email Template
 */
const orderConfirmationEmail = (orderNumber, name, totalAmount) => {
  const content = `
    <div style="font-size: 16px; line-height: 24px; color: #1F2937;">
      <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827; font-family: 'Cinzel', Georgia, serif;">
        Order Confirmation
      </h2>
      <p style="margin: 0 0 16px 0;">
        Dear <strong>${name || 'Collector'}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; color: #4B5563;">
        Thank you for purchasing with Coinomart! We have received your order and our numismatic specialists are preparing your authenticated specimens for secure, insured shipment.
      </p>

      <!-- Order Details Card -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; margin: 20px 0; padding: 18px;">
        <tr>
          <td>
            <table border="0" cellpadding="6" cellspacing="0" width="100%" style="font-size: 15px; color: #374151;">
              <tr>
                <td style="font-weight: 600; width: 140px; color: #4B5563;">Order Number:</td>
                <td><strong style="color: #111827; font-family: 'Courier New', monospace;">${orderNumber}</strong></td>
              </tr>
              <tr>
                <td style="font-weight: 600; color: #4B5563;">Total Amount:</td>
                <td><strong style="color: #059669; font-size: 18px;">₹${Number(totalAmount).toLocaleString('en-IN')}</strong></td>
              </tr>
              <tr>
                <td style="font-weight: 600; color: #4B5563;">Status:</td>
                <td><span style="background-color: #D1FAE5; color: #065F46; padding: 2px 8px; border-radius: 4px; font-size: 13px; font-weight: 600;">Payment Confirmed</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #4B5563;">
        You will receive another update with shipment tracking details once your package is dispatched with our tamper-evident packaging.
      </p>

      <p style="margin: 24px 0 0 0; font-size: 14px; color: #374151; border-top: 1px solid #E5E7EB; padding-top: 16px;">
        Warm regards,<br>
        <strong>The Coinomart Team</strong>
      </p>
    </div>
  `;

  return baseTemplate({
    title: `Order Confirmation - ${orderNumber}`,
    preheader: `Thank you for your order ${orderNumber}. Total: ₹${totalAmount}`,
    content,
  });
};

module.exports = orderConfirmationEmail;
