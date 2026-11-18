/**
 * Base Email Template Layout with Coinomart luxury branding
 */
const baseTemplate = ({ title, preheader, content, showSupport = true }) => {
  const currentYear = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title || 'Coinomart Notification'}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .fluid { max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6F8; color: #333333;">
  ${preheader ? `<div style="display: none; font-size: 1px; color: #F4F6F8; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader}</div>` : ''}
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 30px 15px 40px 15px; background-color: #F4F6F8;">
        <!-- Email Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #EAEAEA;">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #111827 0%, #1F2937 100%); padding: 32px 24px; border-bottom: 3px solid #D4AF37;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #D4AF37; width: 36px; height: 36px; border-radius: 50%; text-align: center; vertical-align: middle; color: #111827; font-weight: bold; font-size: 20px; font-family: 'Cinzel', Georgia, serif;">
                            🪙
                          </td>
                          <td style="padding-left: 12px; font-family: 'Cinzel', Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: 1px;">
                            COINOMART
                          </td>
                        </tr>
                      </table>
                    </a>
                    <p style="margin: 6px 0 0 0; color: #9CA3AF; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;">Rare & Historic Numismatics</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;" class="mobile-padding">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 36px 32px 36px; border-top: 1px solid #E5E7EB; text-align: center;" class="mobile-padding">
              ${showSupport ? `
                <p style="margin: 0 0 12px 0; font-size: 13px; color: #6B7280;">
                  Need help or have questions? <a href="${frontendUrl}/support" style="color: #B8860B; font-weight: 600; text-decoration: underline;">Contact Support</a>
                </p>
              ` : ''}
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9CA3AF;">
                This is an automated security message from Coinomart. Please do not reply directly to this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                &copy; ${currentYear} Coinomart Inc. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

module.exports = baseTemplate;
