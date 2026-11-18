const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Country = require('../models/Country');
const Mint = require('../models/Mint');
const adminRoutes = require('../routes/adminRoutes');
const aiCoinRoutes = require('../routes/aiCoinRoutes');
const { notFound, errorHandler } = require('../middleware/errorHandler');

// Minimal 1x1 PNG Buffer
const createPng = () => Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

async function runVerification() {
  console.log('=== STARTING COMPREHENSIVE VERIFICATION FOR /api/admin/ai-coins/analyze ===');
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coinindia';
  await mongoose.connect(mongoUri);
  console.log('1. Database connected.');

  // Find or create admin user
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Verify Admin',
      email: `admin_verify_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
    });
  }

  // Find or create customer user
  let customerUser = await User.findOne({ role: 'customer' });
  if (!customerUser) {
    customerUser = await User.create({
      name: 'Verify Customer',
      email: `customer_verify_${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'customer',
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'coinindia_default_jwt_secret';
  const adminToken = jwt.sign({ id: adminUser._id }, jwtSecret, { expiresIn: '1h' });
  const customerToken = jwt.sign({ id: customerUser._id }, jwtSecret, { expiresIn: '1h' });

  // Create Express app matching server.js EXACT setup
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // Route Mounting exactly as in server.js
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/ai-coins', aiCoinRoutes);

  app.use(notFound);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`2. Test server listening on ${baseUrl}`);

  // Test 1: Missing Token -> 401
  console.log('\n--- Test 1: Authentication Check (Missing Token) ---');
  const res1 = await fetch(`${baseUrl}/api/admin/ai-coins/analyze`, { method: 'POST' });
  console.log(`Status: ${res1.status} (Expected 401)`);
  if (res1.status !== 401) throw new Error(`Expected 401 but got ${res1.status}`);
  console.log('✓ PASS: Rejected missing token with 401');

  // Test 2: Customer Role -> 403
  console.log('\n--- Test 2: Authorization Check (Customer Token) ---');
  const res2 = await fetch(`${baseUrl}/api/admin/ai-coins/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  console.log(`Status: ${res2.status} (Expected 403)`);
  if (res2.status !== 403) throw new Error(`Expected 403 but got ${res2.status}`);
  console.log('✓ PASS: Rejected non-admin with 403');

  // Test 3: Admin with Single Image ('images' field)
  console.log('\n--- Test 3: Single Image Upload (field: images) ---');
  const boundary = '----WebKitFormBoundaryTest123456';
  const pngData = createPng();
  
  const bodyPartsSingle = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="images"; filename="test_coin_front.png"\r\n`,
    `Content-Type: image/png\r\n\r\n`,
    pngData,
    `\r\n--${boundary}--\r\n`,
  ];
  const bodySingle = Buffer.concat(bodyPartsSingle.map(p => typeof p === 'string' ? Buffer.from(p) : p));

  const res3 = await fetch(`${baseUrl}/api/admin/ai-coins/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: bodySingle,
  });

  console.log(`Status: ${res3.status} (Expected 201)`);
  const data3 = await res3.json();
  console.log('Response Message:', data3.message);
  console.log('Extracted Data Fields Check:');
  const coin = data3.data || data3.draft?.formData;
  console.log(' - Name:', coin?.name);
  console.log(' - Year:', coin?.year);
  console.log(' - Denomination:', coin?.denomination);
  console.log(' - Era:', coin?.era);
  console.log(' - Condition:', coin?.condition);
  console.log(' - Rarity:', coin?.rarity);
  console.log(' - Material:', coin?.material);
  console.log(' - Images count:', data3.draft?.images?.length);

  if (res3.status !== 201) throw new Error(`Expected 201 but got ${res3.status}`);
  if (!data3.draft || !coin) throw new Error('Response missing draft/data');
  console.log('✓ PASS: Single coin analyzed successfully with structured JSON!');

  // Test 4: Admin with Multiple Images ('images' field front + back)
  console.log('\n--- Test 4: Multiple Images Upload (field: images, 2 photos) ---');
  const boundary2 = '----WebKitFormBoundaryTest789012';
  const bodyPartsMulti = [
    `--${boundary2}\r\n`,
    `Content-Disposition: form-data; name="images"; filename="1862_rupee_obverse.png"\r\n`,
    `Content-Type: image/png\r\n\r\n`,
    pngData,
    `\r\n--${boundary2}\r\n`,
    `Content-Disposition: form-data; name="images"; filename="1862_rupee_reverse.png"\r\n`,
    `Content-Type: image/png\r\n\r\n`,
    pngData,
    `\r\n--${boundary2}--\r\n`,
  ];
  const bodyMulti = Buffer.concat(bodyPartsMulti.map(p => typeof p === 'string' ? Buffer.from(p) : p));

  const res4 = await fetch(`${baseUrl}/api/admin/ai-coins/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary2}`,
    },
    body: bodyMulti,
  });

  console.log(`Status: ${res4.status} (Expected 201)`);
  const data4 = await res4.json();
  console.log('Response Message:', data4.message);
  console.log('Images attached in draft:', data4.draft?.images?.length);
  if (res4.status !== 201 || data4.draft?.images?.length !== 2) {
    throw new Error('Multiple images upload failed');
  }
  console.log('✓ PASS: Multiple images analyzed and attached to draft!');

  // Test 5: Single Image with field name 'image' (alias compatibility)
  console.log('\n--- Test 5: Single Image with field name "image" ---');
  const boundary3 = '----WebKitFormBoundaryTest345678';
  const bodyPartsField = [
    `--${boundary3}\r\n`,
    `Content-Disposition: form-data; name="image"; filename="single_photo.png"\r\n`,
    `Content-Type: image/png\r\n\r\n`,
    pngData,
    `\r\n--${boundary3}--\r\n`,
  ];
  const bodyField = Buffer.concat(bodyPartsField.map(p => typeof p === 'string' ? Buffer.from(p) : p));

  const res5 = await fetch(`${baseUrl}/api/admin/ai-coins/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary3}`,
    },
    body: bodyField,
  });

  console.log(`Status: ${res5.status} (Expected 201)`);
  if (res5.status !== 201) throw new Error(`Expected 201 but got ${res5.status}`);
  console.log('✓ PASS: Handled field "image" cleanly!');

  server.close();
  await mongoose.disconnect();
  console.log('\n>>> ALL API VERIFICATION TESTS PASSED SUCCESSFULLY! <<<\n');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
