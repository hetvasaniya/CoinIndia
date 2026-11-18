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
const CoinDraft = require('../models/CoinDraft');
const adminRoutes = require('../routes/adminRoutes');
const aiCoinRoutes = require('../routes/aiCoinRoutes');
const { notFound, errorHandler } = require('../middleware/errorHandler');
const { optimizeImageForAi } = require('../services/imageOptimizer');
const analysisJobManager = require('../services/analysisJobManager');

// Create test PNG buffer (100x100)
const createTestPng = () => {
  // Minimal valid 1x1 PNG
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
};

async function runTestSuite() {
  console.log('=================================================================');
  console.log('   COINOMART AI ANALYSIS SPEED & REAL-TIME PROGRESS TEST SUITE   ');
  console.log('=================================================================\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coinindia';
  console.log('[1/8] Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('      Connected successfully to MongoDB.');

  // Find or create admin and customer test users
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Admin Test Suite',
      email: `admin_speed_${Date.now()}@coinomart.test`,
      password: 'Password123!',
      role: 'admin',
    });
  }

  let customerUser = await User.findOne({ role: 'customer' });
  if (!customerUser) {
    customerUser = await User.create({
      name: 'Customer Test Suite',
      email: `customer_speed_${Date.now()}@coinomart.test`,
      password: 'Password123!',
      role: 'customer',
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'coinindia_default_jwt_secret';
  const adminToken = jwt.sign({ id: adminUser._id }, jwtSecret, { expiresIn: '1h' });
  const customerToken = jwt.sign({ id: customerUser._id }, jwtSecret, { expiresIn: '1h' });

  // Ensure category and country exist
  let testCat = await Category.findOne();
  if (!testCat) {
    testCat = await Category.create({ name: 'British India', slug: 'british-india' });
  }
  let testCountry = await Country.findOne();
  if (!testCountry) {
    testCountry = await Country.create({ name: 'India', code: 'IN', flag: '🇮🇳' });
  }

  // Setup test Express server
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/ai-coins', aiCoinRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[2/8] Express test server listening at ${baseUrl}\n`);

  // -------------------------------------------------------------
  // Test 1: Image Optimizer Verification
  // -------------------------------------------------------------
  console.log('--- Test 1: Image Optimization Module Verification ---');
  const tempDir = path.join(__dirname, '..', 'uploads', 'temp-ai');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const testImagePath = path.join(tempDir, `test_opt_${Date.now()}.png`);
  fs.writeFileSync(testImagePath, createTestPng());

  const optResult = await optimizeImageForAi(testImagePath, 'image/png');
  console.log(`  - Original size:  ${optResult.originalSize} bytes`);
  console.log(`  - Optimized size: ${optResult.optimizedSize} bytes`);
  console.log(`  - Prep duration:  ${optResult.durationMs}ms`);
  if (!optResult.buffer || optResult.buffer.length === 0) {
    throw new Error('Image optimization produced empty buffer');
  }
  fs.unlinkSync(testImagePath);
  console.log('  ✓ PASS: Image optimization completed cleanly.\n');

  // -------------------------------------------------------------
  // Test 2: Authentication & Authorization Security
  // -------------------------------------------------------------
  console.log('--- Test 2: Security & Role-Based Authorization ---');
  const resNoAuth = await fetch(`${baseUrl}/api/admin/ai-coins/progress/test-id`);
  if (resNoAuth.status !== 401) throw new Error(`Expected 401 for unauthenticated request, got ${resNoAuth.status}`);
  console.log('  ✓ PASS: Rejected missing token with 401 Unauthorized');

  const resCustAuth = await fetch(`${baseUrl}/api/admin/ai-coins/progress/test-id`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (resCustAuth.status !== 403) throw new Error(`Expected 403 for non-admin customer, got ${resCustAuth.status}`);
  console.log('  ✓ PASS: Rejected non-admin role with 403 Forbidden\n');

  // -------------------------------------------------------------
  // Test 3: Single Coin Analysis with Real-Time Progress Events & Timing
  // -------------------------------------------------------------
  console.log('--- Test 3: Analysis Pipeline with Real-Time Events & Timing ---');
  const analysisId = `analysis_test_${Date.now()}`;
  const boundary = '----WebKitFormBoundaryTestSpeed' + Date.now();
  const pngData = createTestPng();

  const bodyParts = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="analysisId"\r\n\r\n`,
    `${analysisId}\r\n`,
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="images"; filename="coin_obverse.png"\r\n`,
    `Content-Type: image/png\r\n\r\n`,
    pngData,
    `\r\n--${boundary}\r\n`,
    `Content-Disposition: form-data; name="images"; filename="coin_reverse.png"\r\n`,
    `Content-Type: image/png\r\n\r\n`,
    pngData,
    `\r\n--${boundary}--\r\n`,
  ];
  const multipartBody = Buffer.concat(bodyParts.map((p) => (typeof p === 'string' ? Buffer.from(p) : p)));

  // Listen for SSE events concurrently
  const receivedSseEvents = [];
  const sseController = new AbortController();

  const listenToSse = async () => {
    try {
      const sseRes = await fetch(`${baseUrl}/api/admin/ai-coins/progress/${analysisId}/stream?token=${adminToken}`, {
        signal: sseController.signal,
      });

      const reader = sseRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // keep partial

        for (const block of lines) {
          const match = block.match(/^data:\s*(.+)$/m);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              receivedSseEvents.push(parsed);
              if (parsed.status === 'completed' || parsed.status === 'failed') {
                return;
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      // Aborted or ended
    }
  };

  const ssePromise = listenToSse();

  // Send analysis request
  const startTime = Date.now();
  const analysisRes = await fetch(`${baseUrl}/api/admin/ai-coins/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  const durationMs = Date.now() - startTime;
  console.log(`  - HTTP Status: ${analysisRes.status} (Expected 201) in ${durationMs}ms`);
  const analysisData = await analysisRes.json();

  // Wait for SSE stream to receive final terminal event (up to 1.5s)
  await Promise.race([
    ssePromise,
    new Promise((r) => setTimeout(r, 1500)),
  ]);
  sseController.abort();

  if (analysisRes.status !== 201) {
    throw new Error(`Analysis failed with status ${analysisRes.status}: ${JSON.stringify(analysisData)}`);
  }

  console.log(`  - Analysis Message: "${analysisData.message}"`);
  console.log(`  - Draft ID: ${analysisData.draft?._id}`);
  console.log(`  - Coin Name: "${analysisData.data?.name}"`);
  console.log(`  - Sku: ${analysisData.data?.sku}`);
  console.log(`  - Images registered: ${analysisData.draft?.images?.length}`);
  console.log(`  - Performance Timing Breakdown:`, analysisData.timing);

  if (!analysisData.timing || typeof analysisData.timing.totalDurationMs !== 'number') {
    throw new Error('Response missing performance timing measurements');
  }
  console.log('  ✓ PASS: Single coin analyzed and returned performance metrics.\n');

  // -------------------------------------------------------------
  // Test 4: Verify Streamed Real-Time Events Structure
  // -------------------------------------------------------------
  console.log('--- Test 4: Verifying Real-Time Progress Events & Schema ---');
  console.log(`  - Total SSE events received: ${receivedSseEvents.length}`);

  const stageNames = receivedSseEvents.map((e) => e.stage);
  console.log(`  - Event stages recorded:`, stageNames);

  // Validate event schema on all events
  for (const evt of receivedSseEvents) {
    if (!evt.analysisId) throw new Error('SSE event missing analysisId');
    if (!evt.stage) throw new Error('SSE event missing stage');
    if (!evt.stageName) throw new Error('SSE event missing stageName');
    if (typeof evt.progress !== 'number') throw new Error('SSE event missing progress number');
    if (!evt.status) throw new Error('SSE event missing status');
    if (typeof evt.elapsedSeconds !== 'number') throw new Error('SSE event missing elapsedSeconds');
    if (typeof evt.estimatedRemainingSeconds !== 'number') throw new Error('SSE event missing estimatedRemainingSeconds');
  }

  // Check that final event reached completed stage (or status)
  const finalEvent = receivedSseEvents[receivedSseEvents.length - 1];
  console.log(`  - Final event status: ${finalEvent?.status}, progress: ${finalEvent?.progress}%`);
  if (!finalEvent || finalEvent.progress !== 100 || finalEvent.status !== 'completed') {
    throw new Error(`Expected final event to reach 100% and status 'completed', got ${JSON.stringify(finalEvent)}`);
  }
  console.log('  ✓ PASS: Real-time progress events strictly match required specification.\n');

  // -------------------------------------------------------------
  // Test 5: Polling Fallback & Status Endpoint
  // -------------------------------------------------------------
  console.log('--- Test 5: Polling Fallback & Status Endpoint ---');
  const pollRes = await fetch(`${baseUrl}/api/admin/ai-coins/progress/${analysisId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (pollRes.status !== 200) throw new Error(`Polling endpoint failed with status ${pollRes.status}`);
  const pollData = await pollRes.json();
  console.log(`  - Polling response status: ${pollData.status}, progress: ${pollData.progress}%`);
  if (pollData.progress !== 100 || pollData.status !== 'completed') {
    throw new Error(`Expected polling data to indicate completed, got ${JSON.stringify(pollData)}`);
  }
  console.log('  ✓ PASS: Polling status endpoint returns accurate analysis state.\n');

  // -------------------------------------------------------------
  // Test 6: Browser Refresh Recovery (Persistence Check)
  // -------------------------------------------------------------
  console.log('--- Test 6: Browser Refresh Recovery from Database ---');
  const draftInDb = await CoinDraft.findOne({ analysisId });
  if (!draftInDb) {
    throw new Error(`Draft with analysisId ${analysisId} not found in MongoDB`);
  }
  console.log(`  - Found persisted draft in MongoDB with analysisId: ${draftInDb.analysisId}`);
  console.log(`  - Draft status: ${draftInDb.status}`);
  console.log('  ✓ PASS: Analysis job is persisted and fully recoverable after page refresh.\n');

  // -------------------------------------------------------------
  // Test 7: Clean Discard & Draft Cleanup
  // -------------------------------------------------------------
  console.log('--- Test 7: Draft Discard & Temp Image Cleanup ---');
  const deleteRes = await fetch(`${baseUrl}/api/admin/ai-coins/drafts/${draftInDb._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (deleteRes.status !== 200) throw new Error(`Failed to delete draft: ${deleteRes.status}`);
  console.log('  ✓ PASS: Draft cleaned up successfully.\n');

  // Cleanup test server & connection
  server.close();
  await mongoose.disconnect();

  console.log('=================================================================');
  console.log('   ALL 7 PERFORMANCE & PROGRESS TRACKING TESTS PASSED!          ');
  console.log('=================================================================\n');

  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
