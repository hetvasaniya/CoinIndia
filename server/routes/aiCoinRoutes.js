const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { aiUpload, handleAiUpload } = require('../middleware/aiUpload');
const {
  analyzeSingleCoinDraft,
  analyzeBulkCoinsDraft,
  streamAnalysisProgress,
  getAnalysisProgress,
  getDrafts,
  getDraftById,
  updateDraft,
  retryDraftAnalysis,
  approveDraft,
  deleteDraft,
} = require('../controllers/aiCoinController');

// All AI Coin Registration routes require Admin authentication
router.use(protect, admin);

// Analysis endpoints (supports single or multiple images under 'images', 'image', or any field name)
router.post('/analyze', handleAiUpload(5), analyzeSingleCoinDraft);
router.post('/bulk-analyze', handleAiUpload(25), analyzeBulkCoinsDraft);

// Real-Time Progress Tracking (SSE & Polling Fallback)
router.get('/progress/:analysisId/stream', streamAnalysisProgress);
router.get('/progress/:analysisId', getAnalysisProgress);

// Drafts CRUD & Approval Workflow
router.get('/drafts', getDrafts);
router.get('/drafts/:id', getDraftById);
router.patch('/drafts/:id', updateDraft);
router.post('/drafts/:id/retry', retryDraftAnalysis);
router.post('/drafts/:id/approve', approveDraft);
router.delete('/drafts/:id', deleteDraft);

module.exports = router;
