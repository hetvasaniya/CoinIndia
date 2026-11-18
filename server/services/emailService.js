const https = require('https');
const nodemailer = require('nodemailer');

/**
 * Mailjet & Unified Email Service for Coinomart
 * 
 * Primary: Mailjet API v3.1 Send Endpoint
 * Fallback: Standard SMTP (Gmail App Password / Custom SMTP) if configured
 * Protects secrets, inspects delivery status, and logs detailed server diagnostics.
 */

// Helper to strip HTML tags for plain text fallback
const stripHtml = (html = '') => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Dispatch email via Mailjet REST API v3.1 using standard HTTPS
 */
const sendViaMailjetApi = ({ apiKey, apiSecret, senderEmail, senderName, to, toName, subject, html, text }) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      Messages: [
        {
          From: {
            Email: senderEmail,
            Name: senderName,
          },
          To: [
            {
              Email: to,
              Name: toName || to.split('@')[0],
            },
          ],
          Subject: subject,
          TextPart: text || stripHtml(html),
          HTMLPart: html,
        },
      ],
    });

    const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const options = {
      hostname: 'api.mailjet.com',
      port: 443,
      path: '/v3.1/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': authHeader,
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseBody ? JSON.parse(responseBody) : {};

          // Check if Mailjet returned HTTP level error
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const errorMsg = parsed.ErrorMessage || parsed.message || `Mailjet HTTP error ${res.statusCode}`;
            const err = new Error(errorMsg);
            err.statusCode = res.statusCode;
            err.details = parsed;
            return reject(err);
          }

          // Check message-level status in Mailjet response
          const firstMessage = parsed.Messages?.[0];
          if (firstMessage && firstMessage.Status === 'error') {
            const errorDetails = firstMessage.Errors?.[0] || {};
            const err = new Error(errorDetails.ErrorMessage || 'Mailjet message delivery error');
            err.statusCode = errorDetails.StatusCode || 400;
            err.details = firstMessage.Errors;
            return reject(err);
          }

          resolve({ success: true, status: res.statusCode, data: parsed });
        } catch (parseError) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, status: res.statusCode });
          } else {
            reject(new Error(`Mailjet responded with status ${res.statusCode}`));
          }
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Mailjet request timed out (10s limit exceeded)'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Fallback SMTP dispatcher (e.g. Gmail App Password or custom SMTP)
 */
const sendViaSmtp = async ({ senderEmail, senderName, to, subject, html, text }) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP credentials (SMTP_USER / SMTP_PASS) not configured');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to,
    subject,
    text: text || stripHtml(html),
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, fallback: true, messageId: info.messageId };
};

/**
 * Reusable email dispatch function
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.toName] - Recipient name
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content of the email
 * @param {string} [options.text] - Plain-text fallback content
 * @returns {Promise<Object>}
 */
const sendEmail = async ({ to, toName, subject, html, text }) => {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;
  const senderEmail = process.env.MAILJET_SENDER_EMAIL || process.env.SMTP_USER || 'noreply@coinomart.com';
  const senderName = process.env.MAILJET_SENDER_NAME || 'Coinomart';

  if (!to) {
    throw new Error('Recipient email address is required');
  }

  const hasMailjet = apiKey && apiSecret && !apiKey.includes('your_mailjet') && !apiSecret.includes('your_mailjet') && apiKey.trim() !== '';
  const hasSmtp = process.env.SMTP_USER && process.env.SMTP_PASS;

  // 1. Try Mailjet API if configured
  if (hasMailjet) {
    try {
      let result;
      let mailjetModule = null;
      try {
        mailjetModule = require('node-mailjet');
      } catch (e) {
        mailjetModule = null;
      }

      if (mailjetModule && typeof mailjetModule.apiConnect === 'function') {
        const client = mailjetModule.apiConnect(apiKey, apiSecret);
        const request = await client.post('send', { version: 'v3.1' }).request({
          Messages: [
            {
              From: {
                Email: senderEmail,
                Name: senderName,
              },
              To: [
                {
                  Email: to,
                  Name: toName || to.split('@')[0],
                },
              ],
              Subject: subject,
              TextPart: text || stripHtml(html),
              HTMLPart: html,
            },
          ],
        });

        const firstMsg = request.body?.Messages?.[0];
        if (firstMsg?.Status === 'error') {
          const errorDetail = firstMsg.Errors?.[0]?.ErrorMessage || 'Mailjet message error';
          throw new Error(errorDetail);
        }

        result = { success: true, body: request.body };
      } else {
        result = await sendViaMailjetApi({
          apiKey,
          apiSecret,
          senderEmail,
          senderName,
          to,
          toName,
          subject,
          html,
          text,
        });
      }

      console.log(`[Mailjet Email Service] ✅ Email successfully dispatched to ${to} (Subject: "${subject}")`);
      return result;
    } catch (mailjetError) {
      console.warn(`[Mailjet Email Service] ⚠️ Mailjet sending failed: ${mailjetError.message}`);

      // If SMTP fallback is available, attempt fallback
      if (hasSmtp) {
        console.log(`[Email Service] 🔄 Attempting fallback delivery via SMTP...`);
        try {
          const smtpResult = await sendViaSmtp({
            senderEmail: process.env.SMTP_USER || senderEmail,
            senderName,
            to,
            subject,
            html,
            text,
          });
          console.log(`[Email Service] ✅ Email sent via SMTP fallback to ${to}`);
          return smtpResult;
        } catch (smtpError) {
          console.error(`[Email Service] ❌ SMTP fallback also failed: ${smtpError.message}`);
        }
      }

      // If no fallback succeeded, report detailed error
      console.error(`[Mailjet Email Service] ❌ Failed to send email to ${to}:`, {
        error: mailjetError.message,
        statusCode: mailjetError.statusCode,
        details: mailjetError.details,
        senderEmail,
      });

      throw new Error(mailjetError.message || 'Unable to send email. Please try again later.');
    }
  }

  // 2. If Mailjet is not configured but SMTP is configured, use SMTP
  if (hasSmtp) {
    try {
      const smtpResult = await sendViaSmtp({
        senderEmail: process.env.SMTP_USER || senderEmail,
        senderName,
        to,
        subject,
        html,
        text,
      });
      console.log(`[Email Service] ✅ Email sent via SMTP to ${to}`);
      return smtpResult;
    } catch (smtpError) {
      console.error(`[Email Service] ❌ SMTP send failed: ${smtpError.message}`);
      throw new Error('Unable to send email via SMTP');
    }
  }

  // 3. If neither is configured
  console.warn(
    `[Email Service] ⚠️ Email not sent to ${to}. Neither Mailjet nor SMTP is configured in server/.env.`
  );
  return {
    success: false,
    mocked: true,
    message: 'No email service credentials configured.',
  };
};

module.exports = {
  sendEmail,
  stripHtml,
};
