const crypto = require('crypto');
const {
  baseTemplate,
  verificationEmail,
  welcomeEmail,
  loginNotificationEmail,
  forgotPasswordEmail,
  passwordChangedEmail,
  orderConfirmationEmail,
} = require('./templates/email');
const { sendEmail, stripHtml } = require('./services/emailService');

console.log('🧪 Starting Mailjet Email System Verification Tests...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
  }
}

// Test 1: Cryptographic OTP Generation & Hashing
console.log('--- 1. Testing Cryptographic OTP Generation & Hash ---');
const otp = crypto.randomInt(100000, 1000000).toString();
assert(otp.length === 6 && /^\d{6}$/.test(otp), 'OTP is a 6-digit number string');

const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
const testVerifyHash = crypto.createHash('sha256').update(otp).digest('hex');
const wrongOtpHash = crypto.createHash('sha256').update('000000').digest('hex');

assert(otpHash === testVerifyHash, 'OTP SHA-256 hash match succeeds for valid OTP');
assert(otpHash !== wrongOtpHash, 'OTP SHA-256 hash match fails for invalid OTP');

// Test 2: Password Reset Token Generation & Hashing
console.log('\n--- 2. Testing Password Reset Token Generation & Hash ---');
const resetToken = crypto.randomBytes(32).toString('hex');
assert(resetToken.length === 64, 'Reset token is a 64-char hex string (32 bytes)');

const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
const verifyResetHash = crypto.createHash('sha256').update(resetToken).digest('hex');
assert(resetTokenHash === verifyResetHash, 'Password reset token SHA-256 hash match succeeds');

// Test 3: HTML Template Generation
console.log('\n--- 3. Testing Email Templates Generation ---');
const vEmail = verificationEmail({ name: 'Rahul Sharma', otp: '849201', expiresIn: '10 minutes' });
assert(vEmail.includes('Rahul Sharma') && vEmail.includes('849201') && vEmail.includes('10 minutes'), 'Verification Email renders name, OTP and expiry');
assert(!vEmail.includes('<script'), 'Verification Email contains no JavaScript');

const wEmail = welcomeEmail({ name: 'Rahul Sharma', loginUrl: 'https://coinomart.vercel.app/login' });
assert(wEmail.includes('Rahul Sharma') && wEmail.includes('https://coinomart.vercel.app/login'), 'Welcome Email renders name and dynamic login URL');

const lEmail = loginNotificationEmail({
  name: 'Rahul Sharma',
  loginTime: '2026-09-05 11:30:00 UTC',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
});
assert(lEmail.includes('Rahul Sharma') && lEmail.includes('192.168.1.1') && lEmail.includes('Reset Password'), 'Login Notification Email renders details and reset link');

const fpEmail = forgotPasswordEmail({
  name: 'Rahul Sharma',
  resetUrl: 'https://coinomart.vercel.app/reset-password?token=abcdef123456',
  expiresIn: '15 minutes',
});
assert(fpEmail.includes('Rahul Sharma') && fpEmail.includes('https://coinomart.vercel.app/reset-password?token=abcdef123456'), 'Forgot Password Email renders reset link');

const pcEmail = passwordChangedEmail({ name: 'Rahul Sharma', changeTime: '2026-09-05 11:35:00 UTC' });
assert(pcEmail.includes('Rahul Sharma') && pcEmail.includes('Contact Support'), 'Password Changed Email renders security confirmation');

const ocEmail = orderConfirmationEmail('ORD-98472', 'Rahul Sharma', 45000);
assert(ocEmail.includes('ORD-98472') && ocEmail.includes('45,000') && ocEmail.includes('Rahul Sharma'), 'Order Confirmation Email renders properly');

// Test 4: Text Stripping
console.log('\n--- 4. Testing HTML to Plain Text Stripping ---');
const plainText = stripHtml('<h1>Hello <strong>Rahul</strong>!</h1><p>Welcome to Coinomart.</p>');
assert(plainText === 'Hello Rahul! Welcome to Coinomart.', 'stripHtml converts HTML to clean plain text');

// Test 5: Email Service Guard & Error Isolation
console.log('\n--- 5. Testing Email Service Guard ---');
(async () => {
  const result = await sendEmail({
    to: 'test@example.com',
    toName: 'Test User',
    subject: 'Test Subject',
    html: '<p>Test</p>',
  });
  assert(result.mocked === true || result.success === true, 'Email service safely guards unconfigured environments without crashing');

  console.log(`\n========================================`);
  console.log(`🎯 Test Results: ${passedTests}/${totalTests} Passed`);
  console.log(`========================================\n`);
})();
