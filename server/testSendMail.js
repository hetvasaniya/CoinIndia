const dotenv = require('dotenv');
dotenv.config();

const { sendEmail } = require('./services/emailService');
const { verificationEmail } = require('./templates/email');

const targetEmail = process.argv[2] || process.env.TEST_EMAIL;

if (!targetEmail) {
  console.log(`
========================================================================
✉️  COINOMART MAILJET TEST SCRIPT
========================================================================

Usage:
  node testSendMail.js your-email@gmail.com

This will attempt to send a test verification email directly to your Gmail
using the MAILJET credentials defined in your server/.env file.
========================================================================
  `);
  process.exit(0);
}

console.log(`\n🚀 Sending test email to: ${targetEmail}...`);
console.log(`Using Sender Email: ${process.env.MAILJET_SENDER_EMAIL || 'noreply@coinomart.com'}`);
console.log(`API Key configured: ${process.env.MAILJET_API_KEY ? 'Yes (starts with ' + process.env.MAILJET_API_KEY.substring(0, 4) + '...)' : 'No'}\n`);

sendEmail({
  to: targetEmail,
  toName: 'Coinomart Tester',
  subject: 'Verify your Coinomart account (Test Delivery)',
  html: verificationEmail({
    name: 'Coinomart Tester',
    otp: '582914',
    expiresIn: '10 minutes',
  }),
})
  .then((res) => {
    console.log('\n🎉 SUCCESS! Email was accepted by Mailjet.');
    console.log('Result:', JSON.stringify(res, null, 2));
    console.log('\n👉 Check your Gmail Inbox (and Spam/Promotions folders)!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ ERROR SENDING EMAIL:');
    console.error(err.message);
    process.exit(1);
  });
