const path = require('path');
const fs = require('fs');
const http = require('http');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Country = require('../models/Country');
const Mint = require('../models/Mint');
const Coin = require('../models/Coin');
const CoinDraft = require('../models/CoinDraft');

// Create minimal 1x1 valid PNG buffer for tests
const createDummyPngBuffer = () => {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
};

async function runTests() {
  console.log('=== AI Coin Registration Full Workflow Test Suite ===');
  let exitCode = 0;

  try {
    // 1. Connect Database
    console.log('[1/12] Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coinindia';
    await mongoose.connect(mongoUri);
    console.log('       MongoDB connected successfully.');

    // 2. Prepare Admin User & Token
    console.log('[2/12] Setting up Test Admin and Customer tokens...');
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Test Admin',
        email: `testadmin_${Date.now()}@coinomart.test`,
        password: 'Password123!',
        role: 'admin',
      });
    }

    let customerUser = await User.findOne({ role: 'customer' });
    if (!customerUser) {
      customerUser = await User.create({
        name: 'Test Customer',
        email: `testcustomer_${Date.now()}@coinomart.test`,
        password: 'Password123!',
        role: 'customer',
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'coinindia_default_jwt_secret';
    const adminToken = jwt.sign({ id: adminUser._id }, jwtSecret, { expiresIn: '1d' });
    const customerToken = jwt.sign({ id: customerUser._id }, jwtSecret, { expiresIn: '1d' });

    // Ensure at least one Category and Country exist for testing
    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({ name: 'British India Test', slug: 'british-india-test' });
    }
    let country = await Country.findOne();
    if (!country) {
      country = await Country.create({ name: 'India Test', code: 'INT', flag: '🇮🇳' });
    }

    // 3. Start App on Ephemeral Port
    console.log('[3/12] Starting Express test server...');
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

    const adminRoutes = require('../routes/adminRoutes');
    const aiCoinRoutes = require('../routes/aiCoinRoutes');
    const coinRoutes = require('../routes/coinRoutes');
    app.use('/api/admin', adminRoutes);
    app.use('/api/admin/ai-coins', aiCoinRoutes);
    app.use('/api/coins', coinRoutes);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`       Test server listening on ${baseUrl}`);

    // Helper for requests
    const apiRequest = async (endpoint, options = {}) => {
      const url = `${baseUrl}${endpoint}`;
      return fetch(url, options);
    };

    // 4. Test Security: Unauthorized access without token
    console.log('[4/12] Testing Unauthorized Access (no token)...');
    const resNoToken = await apiRequest('/api/admin/ai-coins/drafts');
    if (resNoToken.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${resNoToken.status}`);
    }
    console.log('       PASS: Correctly rejected with 401 Unauthorized.');

    // 5. Test Security: Forbidden access with Customer token
    console.log('[5/12] Testing Forbidden Access (customer role trying admin route)...');
    const resForbidden = await apiRequest('/api/admin/ai-coins/drafts', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (resForbidden.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${resForbidden.status}`);
    }
    console.log('       PASS: Correctly rejected with 403 Forbidden.');

    // 6. Test Single Coin Upload & Analysis Endpoint
    console.log('[6/12] Testing POST /api/admin/ai-coins/analyze with coin photographs...');
    const dummyImage = createDummyPngBuffer();
    const formData = new FormData();
    formData.append('images', new Blob([dummyImage], { type: 'image/png' }), 'obverse-victoria-1862.png');
    formData.append('images', new Blob([dummyImage], { type: 'image/png' }), 'reverse-victoria-1862.png');

    const resAnalyze = await apiRequest('/api/admin/ai-coins/analyze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });

    const analyzeData = await resAnalyze.json();
    if (resAnalyze.status !== 201 || !analyzeData.draft) {
      throw new Error(`Expected 201 Created with draft, got ${resAnalyze.status}: ${JSON.stringify(analyzeData)}`);
    }

    const createdDraft = analyzeData.draft;
    console.log(`       PASS: Single coin draft created with ID: ${createdDraft._id}`);
    console.log(`             Status: ${createdDraft.status}, SKU: ${createdDraft.formData?.sku}`);
    console.log(`             Images attached: ${createdDraft.images?.length}`);

    // 7. Test Draft Retrieval: GET /api/admin/ai-coins/drafts/:id
    console.log('[7/12] Testing GET /api/admin/ai-coins/drafts/:id...');
    const resGetDraft = await apiRequest(`/api/admin/ai-coins/drafts/${createdDraft._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getDraftData = await resGetDraft.json();
    if (resGetDraft.status !== 200 || getDraftData._id !== createdDraft._id) {
      throw new Error(`Expected 200 with draft, got ${resGetDraft.status}`);
    }
    console.log('       PASS: Retrieved persisted draft correctly.');

    // 8. Test Draft Update / Edit: PATCH /api/admin/ai-coins/drafts/:id
    console.log('[8/12] Testing PATCH /api/admin/ai-coins/drafts/:id to update fields & orientations...');
    const patchPayload = {
      formData: {
        name: '1862 Queen Victoria One Rupee (Calcutta Mint, Silver)',
        year: '1862',
        era: 'British India',
        category: category._id.toString(),
        country: country._id.toString(),
        condition: 'UNC',
        price: 3500,
        quantity: 2,
        material: 'Silver (.917)',
        weight: 11.66,
        diameter: 30.8,
        denomination: '1 Rupee',
        description: 'Historic British India coinage featuring Queen Victoria crowned bust and reverse denomination with lotus wreath.',
        isFeatured: false,
      },
      images: createdDraft.images.map((img, i) => ({
        ...img,
        role: i === 0 ? 'obverse' : 'reverse',
      })),
      status: 'ready_for_approval',
    };

    const resPatch = await apiRequest(`/api/admin/ai-coins/drafts/${createdDraft._id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchPayload),
    });
    const patchedData = await resPatch.json();
    if (resPatch.status !== 200 || patchedData.formData?.name !== patchPayload.formData.name) {
      throw new Error(`Expected updated name, got ${JSON.stringify(patchedData)}`);
    }
    console.log('       PASS: Draft successfully updated and marked ready_for_approval.');

    // 9. Test Validation Failure on Approval: Missing Price or Name
    console.log('[9/12] Testing Validation on Approval (rejecting invalid price)...');
    const resInvalidApprove = await apiRequest(`/api/admin/ai-coins/drafts/${createdDraft._id}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ formData: { price: 0 } }),
    });
    if (resInvalidApprove.status !== 400) {
      throw new Error(`Expected 400 Bad Request for zero price, got ${resInvalidApprove.status}`);
    }
    console.log('       PASS: Approval validation rejected invalid price <= 0.');

    // 10. Test Successful Approval & Marketplace Product Creation
    console.log('[10/12] Testing POST /api/admin/ai-coins/drafts/:id/approve (publishing to marketplace)...');
    const resApprove = await apiRequest(`/api/admin/ai-coins/drafts/${createdDraft._id}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formData: {
          price: 3500,
          quantity: 2,
        },
      }),
    });
    const approveData = await resApprove.json();
    if (resApprove.status !== 201 || !approveData.coin) {
      throw new Error(`Expected 201 with created coin, got ${resApprove.status}: ${JSON.stringify(approveData)}`);
    }
    const createdCoin = approveData.coin;
    console.log(`       PASS: Marketplace Coin created with ID: ${createdCoin._id}`);
    console.log(`             Slug: ${createdCoin.slug}, SKU: ${createdCoin.sku}`);
    console.log(`             Selling Price: ₹${createdCoin.sellingPrice}, Stock: ${createdCoin.quantity}`);

    // Verify draft status is now 'approved' and coinId is linked
    const verifiedDraft = await CoinDraft.findById(createdDraft._id);
    if (verifiedDraft.status !== 'approved' || verifiedDraft.coinId.toString() !== createdCoin._id.toString()) {
      throw new Error(`Draft state mismatch: ${verifiedDraft.status}, coinId: ${verifiedDraft.coinId}`);
    }
    console.log('       PASS: Draft status changed to "approved" with locked coinId.');

    // 11. Test Duplicate Approval Prevention (Double Click Protection)
    console.log('[11/12] Testing Duplicate Approval Prevention...');
    const resDupApprove = await apiRequest(`/api/admin/ai-coins/drafts/${createdDraft._id}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (resDupApprove.status !== 400) {
      throw new Error(`Expected 400 for already-approved draft, got ${resDupApprove.status}`);
    }
    console.log('       PASS: Prevented duplicate approval of already-published draft.');

    // 12. Test Bulk Analysis Endpoint & Draft Deletion
    console.log('[12/12] Testing POST /api/admin/ai-coins/bulk-analyze & DELETE /drafts/:id...');
    const bulkForm = new FormData();
    bulkForm.append('images', new Blob([dummyImage], { type: 'image/png' }), 'batch_coin1_obv.png');
    bulkForm.append('images', new Blob([dummyImage], { type: 'image/png' }), 'batch_coin1_rev.png');
    bulkForm.append('images', new Blob([dummyImage], { type: 'image/png' }), 'batch_coin2_obv.png');

    const resBulk = await apiRequest('/api/admin/ai-coins/bulk-analyze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: bulkForm,
    });
    const bulkData = await resBulk.json();
    if (resBulk.status !== 201 || !Array.isArray(bulkData.drafts)) {
      throw new Error(`Expected 201 with bulk drafts, got ${resBulk.status}: ${JSON.stringify(bulkData)}`);
    }
    console.log(`       PASS: Bulk upload generated ${bulkData.drafts.length} drafts with batchId: ${bulkData.batchId}`);

    // Test Deleting one of the bulk drafts
    const draftToDelete = bulkData.drafts[0];
    const resDelete = await apiRequest(`/api/admin/ai-coins/drafts/${draftToDelete._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (resDelete.status !== 200) {
      throw new Error(`Expected 200 on delete, got ${resDelete.status}`);
    }
    const checkDeleted = await CoinDraft.findById(draftToDelete._id);
    if (checkDeleted) {
      throw new Error('Draft should have been deleted from DB');
    }
    console.log('       PASS: Successfully deleted draft and cleaned up.');

    // Clean up created test coin
    await Coin.findByIdAndDelete(createdCoin._id);
    await CoinDraft.deleteMany({ batchId: bulkData.batchId });
    await CoinDraft.findByIdAndDelete(createdDraft._id);

    // Close test server
    server.close();
    console.log('\n>>> ALL 12/12 WORKFLOW TESTS PASSED SUCCESSFULLY! <<<');
  } catch (err) {
    console.error('\n❌ Test Suite Failed with error:', err.message);
    if (err.stack) console.error(err.stack);
    exitCode = 1;
  } finally {
    await mongoose.disconnect();
    process.exit(exitCode);
  }
}

runTests();
