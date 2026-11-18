const path = require('path');
const fs = require('fs');
const Coin = require('../models/Coin');
const CoinDraft = require('../models/CoinDraft');
const Category = require('../models/Category');
const Country = require('../models/Country');
const Mint = require('../models/Mint');
const {
  analyzeSingleCoin,
  analyzeBulkCoins,
  isConfiguredApiKey,
  validateApiKey,
} = require('../services/geminiService');
const {
  generateUniqueSku,
  matchCatalogEntities,
  determineDraftStatus,
} = require('../services/aiCoinHelper');
const { uploadToCloudinary } = require('../services/cloudinaryHelper');
const analysisJobManager = require('../services/analysisJobManager');

/**
 * In-memory cached catalog context with 5-minute TTL
 * Eliminates redundant database roundtrips on repeated analysis calls
 */
let catalogCache = null;
let catalogCacheTime = 0;
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

const getCatalogContext = async () => {
  if (catalogCache && Date.now() - catalogCacheTime < CATALOG_CACHE_TTL_MS) {
    return catalogCache;
  }
  const [categories, countries, mints] = await Promise.all([
    Category.find({ isActive: true }).select('name slug _id'),
    Country.find({ isActive: true }).select('name code flag _id'),
    Mint.find({ isActive: true }).select('name location mintMark _id'),
  ]);
  catalogCache = { categories, countries, mints };
  catalogCacheTime = Date.now();
  return catalogCache;
};

/**
 * POST /api/admin/ai-coins/analyze
 * Single Coin Analysis & Draft Creation with Real-Time Progress Tracking
 */
const analyzeSingleCoinDraft = async (req, res) => {
  const overallStart = Date.now();
  const timing = {
    imagePreparationMs: 0,
    geminiApiResponseMs: 0,
    jsonParsingMs: 0,
    validationMs: 0,
    databaseSaveMs: 0,
    totalDurationMs: 0,
  };

  const analysisId =
    req.body.analysisId ||
    `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const userId = req.user ? req.user._id : null;

  // Initialize tracking job
  analysisJobManager.createJob(analysisId, userId);

  try {
    let files = req.files;
    if ((!files || files.length === 0) && req.file) {
      files = [req.file];
    }

    if (!files || files.length === 0) {
      analysisJobManager.updateProgress(analysisId, {
        stage: 'failed',
        status: 'failed',
        error: 'At least one coin photograph is required for analysis.',
        message: 'No coin photographs provided.',
      });
      return res.status(400).json({ message: 'At least one coin photograph is required for analysis.' });
    }

    // Stage 1: Preparing uploaded image
    analysisJobManager.updateProgress(analysisId, {
      stage: 'preparing_image',
      message: `Preparing ${files.length} coin photograph(s)...`,
    });

    const imageRecords = files.map((file) => ({
      url: `/uploads/temp-ai/${file.filename}`,
      localPath: file.path,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      role: 'uncertain',
      isCloudinary: false,
    }));

    // Stage 2: Optimizing image quality
    const imgPrepStart = Date.now();
    analysisJobManager.updateProgress(analysisId, {
      stage: 'optimizing_image',
      message: 'Optimizing and compressing coin photograph for Gemini Vision...',
    });

    // Concurrently fetch catalog context while prepping
    const [catalogContext] = await Promise.all([
      getCatalogContext(),
    ]);

    timing.imagePreparationMs = Date.now() - imgPrepStart;

    // Stage 3: Connecting to Gemini AI
    analysisJobManager.updateProgress(analysisId, {
      stage: 'connecting_gemini',
      message: 'Connecting to Gemini AI and initializing numismatic inspection...',
      timing: { imagePreparationMs: timing.imagePreparationMs },
    });

    const keyCheck = validateApiKey(process.env.GEMINI_API_KEY);
    const hasApiKey = keyCheck.valid;

    let aiResult = null;
    let analysisError = null;

    if (!hasApiKey) {
      analysisError = `${keyCheck.reason} Please add a valid Gemini API key (starts with "AIzaSy...") to server/.env.`;
      console.warn(`[analyzeSingleCoinDraft] ${analysisError}`);
    } else {
      const geminiStart = Date.now();
      try {
        aiResult = await analyzeSingleCoin(imageRecords, catalogContext, (progressStage) => {
          if (progressStage === 'identifying_coin') {
            analysisJobManager.updateProgress(analysisId, {
              stage: 'identifying_coin',
              message: 'Gemini is identifying coin inscriptions, ruler portraits, and emblems...',
            });
          } else if (progressStage === 'analyzing_details') {
            analysisJobManager.updateProgress(analysisId, {
              stage: 'analyzing_details',
              message: 'Analyzing denomination, year of issue, country of origin, and mint mark...',
            });
          } else if (progressStage === 'analyzing_condition') {
            analysisJobManager.updateProgress(analysisId, {
              stage: 'analyzing_condition',
              message: 'Evaluating strike quality, field wear, condition grade, and rarity...',
            });
          } else if (progressStage === 'generating_results') {
            analysisJobManager.updateProgress(analysisId, {
              stage: 'generating_results',
              message: 'Generating structured numismatic catalog fields...',
            });
          }
        });
        timing.geminiApiResponseMs = Date.now() - geminiStart;
      } catch (err) {
        timing.geminiApiResponseMs = Date.now() - geminiStart;
        console.error('Gemini analysis failed:', err.message);
        analysisError = err.message || 'Gemini API call failed';
      }
    }

    // Stage 8: Validating AI response
    const validationStart = Date.now();
    analysisJobManager.updateProgress(analysisId, {
      stage: 'validating_response',
      message: 'Validating numismatic fields and matching catalog reference data...',
    });

    const defaultName = req.files[0]?.originalname
      ? path.parse(req.files[0].originalname).name.replace(/[-_]/g, ' ')
      : 'Unidentified Coin Artifact';
    const rawData = aiResult || {};

    // Match catalog entities
    const matched = matchCatalogEntities(
      rawData,
      catalogContext.categories,
      catalogContext.countries,
      catalogContext.mints
    );

    // Assign image roles if detected by Gemini
    if (aiResult) {
      if (typeof aiResult.obverseImageIndex === 'number' && imageRecords[aiResult.obverseImageIndex]) {
        imageRecords[aiResult.obverseImageIndex].role = 'obverse';
      }
      if (typeof aiResult.reverseImageIndex === 'number' && imageRecords[aiResult.reverseImageIndex]) {
        imageRecords[aiResult.reverseImageIndex].role = 'reverse';
      }

      if (Array.isArray(aiResult.imageRoles)) {
        aiResult.imageRoles.forEach((ir) => {
          if (imageRecords[ir.index] && ir.role) {
            imageRecords[ir.index].role = ir.role;
          }
        });
      }
    }

    if (imageRecords.length === 2 && imageRecords.every((img) => img.role === 'uncertain')) {
      imageRecords[0].role = 'obverse';
      imageRecords[1].role = 'reverse';
    } else if (imageRecords.length === 1 && imageRecords[0].role === 'uncertain') {
      imageRecords[0].role = 'obverse';
    }

    const uniqueSku = await generateUniqueSku(
      rawData.historicalEra || 'British India',
      rawData.yearOfIssue ? String(rawData.yearOfIssue) : ''
    );

    const formData = {
      name: rawData.artifactName || defaultName,
      year: rawData.yearOfIssue ? String(rawData.yearOfIssue) : '',
      sku: uniqueSku,
      category: matched.category,
      categorySuggestedName: matched.categoryName,
      country: matched.country,
      countrySuggestedName: matched.countryName,
      mint: matched.mint,
      mintSuggestedName: matched.mintName,
      era: rawData.historicalEra || 'British India',
      condition: rawData.conditionGrade || 'UNC',
      rarity: rawData.rarity || 'Common',
      description: rawData.historicalNarrative || '',
      material: rawData.metalComposition || '',
      weight: rawData.weight ? Number(rawData.weight) : null,
      diameter: rawData.diameter ? Number(rawData.diameter) : null,
      denomination: rawData.faceDenomination || '',
      mintMark: rawData.mintMarkLocation || '',
      obverseDesign: rawData.obverseDesign || '',
      reverseDesign: rawData.reverseDesign || '',
      price: rawData.suggestedPriceINR ? Number(rawData.suggestedPriceINR) : null,
      estimatedMarketValue: rawData.suggestedPriceINR ? Number(rawData.suggestedPriceINR) : null,
      quantity: 1,
      isFeatured: false,
    };

    const status = analysisError
      ? 'analysis_failed'
      : determineDraftStatus(formData, rawData.confidence, rawData.uncertainFields, rawData.missingFields);

    timing.validationMs = Date.now() - validationStart;

    // Stage 9: Saving analysis results
    const dbStart = Date.now();
    analysisJobManager.updateProgress(analysisId, {
      stage: 'saving_results',
      message: 'Saving verified coin draft to database...',
    });

    const draft = new CoinDraft({
      analysisId,
      mode: 'single',
      status,
      images: imageRecords,
      formData,
      confidence: rawData.confidence || {},
      uncertainFields: rawData.uncertainFields || [],
      missingFields: rawData.missingFields || [],
      reasoningSummary: rawData.reasoningSummary || '',
      alternativePossibilities: rawData.alternativePossibilities || [],
      rawAiOutput: aiResult,
      analysisError,
      createdBy: req.user ? req.user._id : null,
    });

    const savedDraft = await draft.save();
    const populatedDraft = await CoinDraft.findById(savedDraft._id)
      .populate('formData.category', 'name slug')
      .populate('formData.country', 'name flag code')
      .populate('formData.mint', 'name mintMark location');

    timing.databaseSaveMs = Date.now() - dbStart;
    timing.totalDurationMs = Date.now() - overallStart;

    // Log backend performance timing breakdown without exposing sensitive data
    console.log(
      `[AI Analysis Performance] analysisId=${analysisId} | Total: ${(timing.totalDurationMs / 1000).toFixed(2)}s\n` +
      `  - Image prep & optimization: ${timing.imagePreparationMs}ms\n` +
      `  - Gemini API response:       ${timing.geminiApiResponseMs}ms\n` +
      `  - Validation & SKU:          ${timing.validationMs}ms\n` +
      `  - Database save:             ${timing.databaseSaveMs}ms`
    );

    // Stage 10: Analysis completed
    analysisJobManager.updateProgress(analysisId, {
      stage: 'completed',
      status: 'completed',
      progress: 100,
      message: analysisError
        ? 'Draft created with manual review required.'
        : 'Analysis completed successfully! Review your draft below.',
      draftId: savedDraft._id,
      timing,
    });

    res.status(201).json({
      message: analysisError
        ? 'Draft created, but automated AI analysis encountered an issue. You can fill in the fields manually or retry.'
        : 'Coin analyzed successfully and draft generated for review.',
      analysisId,
      draft: populatedDraft,
      data: populatedDraft ? populatedDraft.formData : formData,
      coin: populatedDraft ? populatedDraft.formData : formData,
      analysisWarning: analysisError,
      timing,
    });
  } catch (error) {
    console.error('analyzeSingleCoinDraft error:', error);
    timing.totalDurationMs = Date.now() - overallStart;

    analysisJobManager.updateProgress(analysisId, {
      stage: 'failed',
      status: 'failed',
      error: error.message || 'Failed to process coin analysis',
      message: error.message || 'Analysis failed',
      timing,
    });

    res.status(500).json({
      message: error.message || 'Failed to process single coin analysis',
      analysisId,
    });
  }
};

/**
 * POST /api/admin/ai-coins/bulk-analyze
 * Bulk Coin Analysis & Multi-Draft Creation
 */
const analyzeBulkCoinsDraft = async (req, res) => {
  const overallStart = Date.now();
  const analysisId = req.body.analysisId || `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const userId = req.user ? req.user._id : null;

  analysisJobManager.createJob(analysisId, userId);

  try {
    if (!req.files || req.files.length === 0) {
      analysisJobManager.updateProgress(analysisId, {
        stage: 'failed',
        status: 'failed',
        error: 'At least one photograph is required for bulk analysis.',
      });
      return res.status(400).json({ message: 'At least one photograph is required for bulk analysis.' });
    }

    analysisJobManager.updateProgress(analysisId, {
      stage: 'preparing_image',
      message: `Preparing batch of ${req.files.length} coin photographs...`,
    });

    const batchId = `batch-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const imageRecords = req.files.map((file, idx) => ({
      index: idx,
      url: `/uploads/temp-ai/${file.filename}`,
      localPath: file.path,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      role: 'uncertain',
      isCloudinary: false,
    }));

    analysisJobManager.updateProgress(analysisId, {
      stage: 'optimizing_image',
      message: 'Optimizing and compressing batch photographs for Gemini Vision...',
    });

    const catalogContext = await getCatalogContext();
    const keyCheck = validateApiKey(process.env.GEMINI_API_KEY);
    const hasApiKey = keyCheck.valid;

    analysisJobManager.updateProgress(analysisId, {
      stage: 'connecting_gemini',
      message: 'Connecting to Gemini AI for multi-photo clustering and identification...',
    });

    let bulkResult = null;
    let analysisError = null;

    if (!hasApiKey) {
      analysisError = `${keyCheck.reason} Please configure a valid Gemini API key in server/.env.`;
    } else {
      try {
        bulkResult = await analyzeBulkCoins(imageRecords, catalogContext, (progressStage) => {
          if (progressStage === 'identifying_coin') {
            analysisJobManager.updateProgress(analysisId, {
              stage: 'identifying_coin',
              message: 'Gemini is clustering obverse/reverse pairs...',
            });
          } else if (progressStage === 'analyzing_details') {
            analysisJobManager.updateProgress(analysisId, {
              stage: 'analyzing_details',
              message: 'Identifying denominations and mint marks across batch...',
            });
          }
        });
      } catch (err) {
        console.error('Gemini bulk analysis failed:', err.message);
        analysisError = err.message || 'Gemini bulk API call failed';
      }
    }

    analysisJobManager.updateProgress(analysisId, {
      stage: 'validating_response',
      message: 'Validating clustered artifacts and preparing draft records...',
    });

    const createdDrafts = [];

    // If analysis succeeded and identified artifacts
    if (bulkResult && Array.isArray(bulkResult.artifacts) && bulkResult.artifacts.length > 0) {
      const assignedImageIndices = new Set();

      // Concurrently create and persist all detected coin artifacts
      const artifactPromises = bulkResult.artifacts.map(async (artifact, i) => {
        const artifactImgIndices = artifact.imageIndices || [i];
        artifactImgIndices.forEach((idx) => assignedImageIndices.add(idx));

        const coinImages = artifactImgIndices
          .map((idx) => {
            const img = imageRecords[idx];
            if (!img) return null;
            let role = 'uncertain';
            if (artifact.obverseImageIndex === idx) role = 'obverse';
            else if (artifact.reverseImageIndex === idx) role = 'reverse';
            else if (Array.isArray(artifact.imageRoles)) {
              const matchedRole = artifact.imageRoles.find((r) => r.index === idx);
              if (matchedRole) role = matchedRole.role;
            }
            return {
              url: img.url,
              localPath: img.localPath,
              originalName: img.originalName,
              mimetype: img.mimetype,
              size: img.size,
              role,
              isCloudinary: false,
            };
          })
          .filter(Boolean);

        if (coinImages.length === 2 && coinImages.every((img) => img.role === 'uncertain')) {
          coinImages[0].role = 'obverse';
          coinImages[1].role = 'reverse';
        } else if (coinImages.length === 1 && coinImages[0].role === 'uncertain') {
          coinImages[0].role = 'obverse';
        }

        const matched = matchCatalogEntities(
          artifact,
          catalogContext.categories,
          catalogContext.countries,
          catalogContext.mints
        );

        const uniqueSku = await generateUniqueSku(
          artifact.historicalEra || 'British India',
          artifact.yearOfIssue ? String(artifact.yearOfIssue) : ''
        );

        const formData = {
          name: artifact.artifactName || `Batch Artifact #${i + 1}`,
          year: artifact.yearOfIssue ? String(artifact.yearOfIssue) : '',
          sku: uniqueSku,
          category: matched.category,
          categorySuggestedName: matched.categoryName,
          country: matched.country,
          countrySuggestedName: matched.countryName,
          mint: matched.mint,
          mintSuggestedName: matched.mintName,
          era: artifact.historicalEra || 'British India',
          condition: artifact.conditionGrade || 'UNC',
          description: artifact.historicalNarrative || '',
          material: artifact.metalComposition || '',
          weight: artifact.weight ? Number(artifact.weight) : null,
          diameter: artifact.diameter ? Number(artifact.diameter) : null,
          denomination: artifact.faceDenomination || '',
          mintMark: artifact.mintMarkLocation || '',
          obverseDesign: artifact.obverseDesign || '',
          reverseDesign: artifact.reverseDesign || '',
          price: artifact.suggestedPriceINR ? Number(artifact.suggestedPriceINR) : null,
          estimatedMarketValue: artifact.suggestedPriceINR ? Number(artifact.suggestedPriceINR) : null,
          quantity: 1,
          isFeatured: false,
        };

        const status = determineDraftStatus(
          formData,
          artifact.confidence,
          artifact.uncertainFields,
          artifact.missingFields
        );

        const draft = new CoinDraft({
          analysisId,
          batchId,
          mode: 'bulk',
          status,
          images: coinImages,
          formData,
          confidence: artifact.confidence || {},
          uncertainFields: artifact.uncertainFields || [],
          missingFields: artifact.missingFields || [],
          reasoningSummary: artifact.reasoningSummary || '',
          alternativePossibilities: artifact.alternativePossibilities || [],
          rawAiOutput: artifact,
          createdBy: req.user ? req.user._id : null,
        });

        return draft.save();
      });

      const savedArtifacts = await Promise.all(artifactPromises);
      createdDrafts.push(...savedArtifacts);

      // Handle unassigned/unmatched images concurrently
      const unassignedPromises = [];
      imageRecords.forEach((img, idx) => {
        if (!assignedImageIndices.has(idx)) {
          const unassignedDraft = new CoinDraft({
            analysisId,
            batchId,
            mode: 'bulk',
            status: 'needs_manual_review',
            images: [
              {
                url: img.url,
                localPath: img.localPath,
                originalName: img.originalName,
                mimetype: img.mimetype,
                size: img.size,
                role: 'uncertain',
                isCloudinary: false,
              },
            ],
            formData: {
              name: `Unmatched Coin Photo (${img.originalName})`,
              quantity: 1,
              isFeatured: false,
            },
            uncertainFields: ['artifactName', 'grouping'],
            missingFields: ['category', 'country', 'era', 'condition', 'price'],
            reasoningSummary: 'This photograph could not be grouped with high confidence. Please inspect manually.',
            createdBy: req.user ? req.user._id : null,
          });
          unassignedPromises.push(unassignedDraft.save());
        }
      });

      const savedUnassigned = await Promise.all(unassignedPromises);
      createdDrafts.push(...savedUnassigned);
    } else {
      // Fallback: create individual drafts concurrently
      const fallbackPromises = imageRecords.map((img) => {
        const draft = new CoinDraft({
          analysisId,
          batchId,
          mode: 'bulk',
          status: 'needs_manual_review',
          images: [
            {
              url: img.url,
              localPath: img.localPath,
              originalName: img.originalName,
              mimetype: img.mimetype,
              size: img.size,
              role: 'obverse',
              isCloudinary: false,
            },
          ],
          formData: {
            name: path.parse(img.originalName).name.replace(/[-_]/g, ' '),
            quantity: 1,
            isFeatured: false,
          },
          analysisError,
          createdBy: req.user ? req.user._id : null,
        });
        return draft.save();
      });

      const savedFallbacks = await Promise.all(fallbackPromises);
      createdDrafts.push(...savedFallbacks);
    }

    analysisJobManager.updateProgress(analysisId, {
      stage: 'saving_results',
      message: 'Populating batch draft records...',
    });

    const populatedDrafts = await CoinDraft.find({ batchId })
      .populate('formData.category', 'name slug')
      .populate('formData.country', 'name flag code')
      .populate('formData.mint', 'name mintMark location');

    const totalDurationMs = Date.now() - overallStart;

    analysisJobManager.updateProgress(analysisId, {
      stage: 'completed',
      status: 'completed',
      progress: 100,
      message: `Identified ${populatedDrafts.length} coin draft(s) from batch upload.`,
      timing: { totalDurationMs },
    });

    res.status(201).json({
      message: analysisError
        ? `Bulk upload processed. AI clustering unavailable (${analysisError}). Uploaded images saved as editable drafts.`
        : `Successfully identified ${populatedDrafts.length} coin draft(s) from batch upload.`,
      batchId,
      analysisId,
      drafts: populatedDrafts,
      analysisWarning: analysisError,
    });
  } catch (error) {
    console.error('analyzeBulkCoinsDraft error:', error);
    analysisJobManager.updateProgress(analysisId, {
      stage: 'failed',
      status: 'failed',
      error: error.message || 'Bulk coin analysis failed',
    });
    res.status(500).json({ message: error.message || 'Failed to process bulk coin analysis', analysisId });
  }
};

/**
 * GET /api/admin/ai-coins/progress/:analysisId/stream
 * Real-Time Server-Sent Events (SSE) Stream for an Analysis Job
 */
const streamAnalysisProgress = async (req, res) => {
  const { analysisId } = req.params;
  const job = analysisJobManager.getJob(analysisId);

  // Security check: ensure user only subscribes to their own job
  if (job && job.userId && req.user && job.userId !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied to this analysis job.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  analysisJobManager.registerSseClient(analysisId, res, req.user);
};

/**
 * GET /api/admin/ai-coins/progress/:analysisId
 * Polling Fallback & Status Recovery endpoint
 */
const getAnalysisProgress = async (req, res) => {
  const { analysisId } = req.params;
  let job = analysisJobManager.getJob(analysisId);

  // If job purged from memory, check if draft was already saved with this analysisId
  if (!job) {
    const draft = await CoinDraft.findOne({ analysisId })
      .populate('formData.category', 'name slug')
      .populate('formData.country', 'name flag code')
      .populate('formData.mint', 'name mintMark location');

    if (draft) {
      return res.json({
        success: true,
        analysisId,
        stage: 'completed',
        stageName: 'Analysis completed.',
        progress: 100,
        status: 'completed',
        elapsedSeconds: 0,
        estimatedRemainingSeconds: 0,
        hasHistoricalData: true,
        message: 'Analysis completed and draft retrieved.',
        draftId: draft._id,
        draft,
      });
    }

    return res.status(404).json({ message: 'Analysis job not found or has expired.' });
  }

  if (job.userId && req.user && job.userId !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied to this analysis job.' });
  }

  const payload = analysisJobManager.formatEvent(job);
  res.json({ success: true, ...payload });
};

/**
 * GET /api/admin/ai-coins/drafts
 * List drafts with optional filtering and pagination
 */
const getDrafts = async (req, res) => {
  try {
    const { status, batchId, mode, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (batchId) {
      filter.batchId = batchId;
    }
    if (mode) {
      filter.mode = mode;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const count = await CoinDraft.countDocuments(filter);

    const drafts = await CoinDraft.find(filter)
      .populate('formData.category', 'name slug')
      .populate('formData.country', 'name flag code')
      .populate('formData.mint', 'name mintMark location')
      .populate('coinId', 'name slug sellingPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      drafts,
      total: count,
      page: Number(page),
      pages: Math.ceil(count / Number(limit)) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/admin/ai-coins/drafts/:id
 * Retrieve a specific draft
 */
const getDraftById = async (req, res) => {
  try {
    const draft = await CoinDraft.findById(req.params.id)
      .populate('formData.category', 'name slug')
      .populate('formData.country', 'name flag code')
      .populate('formData.mint', 'name mintMark location')
      .populate('coinId', 'name slug sellingPrice images');

    if (!draft) {
      return res.status(404).json({ message: 'Coin draft not found' });
    }

    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/admin/ai-coins/drafts/:id
 * Update draft fields, image roles, or manual values
 */
const updateDraft = async (req, res) => {
  try {
    const draft = await CoinDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ message: 'Coin draft not found' });
    }

    if (draft.status === 'approved') {
      return res.status(400).json({ message: 'Approved drafts cannot be modified directly. Edit the live coin instead.' });
    }

    if (req.body.formData) {
      draft.formData = {
        ...draft.formData.toObject(),
        ...req.body.formData,
      };
    }

    if (req.body.images && Array.isArray(req.body.images)) {
      draft.images = req.body.images;
    }

    if (req.body.status) {
      draft.status = req.body.status;
    }

    const updated = await draft.save();
    const populated = await CoinDraft.findById(updated._id)
      .populate('formData.category', 'name slug')
      .populate('formData.country', 'name flag code')
      .populate('formData.mint', 'name mintMark location');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/admin/ai-coins/drafts/:id/retry
 * Retry Gemini AI analysis on an existing draft
 */
const retryDraftAnalysis = async (req, res) => {
  const analysisId = req.body.analysisId || `retry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const userId = req.user ? req.user._id : null;

  analysisJobManager.createJob(analysisId, userId);

  try {
    const draft = await CoinDraft.findById(req.params.id);
    if (!draft) {
      analysisJobManager.updateProgress(analysisId, {
        stage: 'failed',
        status: 'failed',
        error: 'Coin draft not found',
      });
      return res.status(404).json({ message: 'Coin draft not found' });
    }

    if (draft.status === 'approved') {
      analysisJobManager.updateProgress(analysisId, {
        stage: 'failed',
        status: 'failed',
        error: 'Draft is already approved.',
      });
      return res.status(400).json({ message: 'Draft is already approved.' });
    }

    if (!draft.images || draft.images.length === 0) {
      analysisJobManager.updateProgress(analysisId, {
        stage: 'failed',
        status: 'failed',
        error: 'No images available on this draft for analysis.',
      });
      return res.status(400).json({ message: 'No images available on this draft for analysis.' });
    }

    analysisJobManager.updateProgress(analysisId, {
      stage: 'preparing_image',
      message: 'Locating original draft images...',
    });

    const catalogContext = await getCatalogContext();
    const imageFiles = draft.images
      .filter((img) => img.localPath && fs.existsSync(img.localPath))
      .map((img) => ({
        localPath: img.localPath,
        originalName: img.originalName || 'coin.jpg',
        mimetype: img.mimetype || 'image/jpeg',
      }));

    if (imageFiles.length === 0) {
      analysisJobManager.updateProgress(analysisId, {
        stage: 'failed',
        status: 'failed',
        error: 'Original local images are no longer available for re-analysis.',
      });
      return res.status(400).json({ message: 'Original local images are no longer available for re-analysis.' });
    }

    const keyCheck = validateApiKey(process.env.GEMINI_API_KEY);
    if (!keyCheck.valid) {
      analysisJobManager.updateProgress(analysisId, {
        stage: 'failed',
        status: 'failed',
        error: keyCheck.reason,
      });
      return res.status(400).json({
        message: `${keyCheck.reason} Please obtain an API key from https://aistudio.google.com/app/apikey (starts with "AIzaSy..."), add it to server/.env, and restart the server.`,
      });
    }

    analysisJobManager.updateProgress(analysisId, {
      stage: 'connecting_gemini',
      message: 'Connecting to Gemini AI for re-analysis...',
    });

    const aiResult = await analyzeSingleCoin(imageFiles, catalogContext, (progressStage) => {
      if (progressStage === 'identifying_coin') {
        analysisJobManager.updateProgress(analysisId, {
          stage: 'identifying_coin',
          message: 'Gemini is re-identifying coin details...',
        });
      } else if (progressStage === 'analyzing_details') {
        analysisJobManager.updateProgress(analysisId, {
          stage: 'analyzing_details',
          message: 'Re-analyzing denomination, year, and mint mark...',
        });
      }
    });

    analysisJobManager.updateProgress(analysisId, {
      stage: 'validating_response',
      message: 'Merging AI findings with catalog reference data...',
    });

    const matched = matchCatalogEntities(
      aiResult,
      catalogContext.categories,
      catalogContext.countries,
      catalogContext.mints
    );

    // Update image roles
    if (typeof aiResult.obverseImageIndex === 'number' && draft.images[aiResult.obverseImageIndex]) {
      draft.images[aiResult.obverseImageIndex].role = 'obverse';
    }
    if (typeof aiResult.reverseImageIndex === 'number' && draft.images[aiResult.reverseImageIndex]) {
      draft.images[aiResult.reverseImageIndex].role = 'reverse';
    }

    // Merge into formData preserving manually entered values where appropriate
    draft.formData.name = aiResult.artifactName || draft.formData.name;
    draft.formData.year = aiResult.yearOfIssue ? String(aiResult.yearOfIssue) : draft.formData.year;
    draft.formData.category = matched.category || draft.formData.category;
    draft.formData.categorySuggestedName = matched.categoryName;
    draft.formData.country = matched.country || draft.formData.country;
    draft.formData.countrySuggestedName = matched.countryName;
    draft.formData.mint = matched.mint || draft.formData.mint;
    draft.formData.mintSuggestedName = matched.mintName;
    draft.formData.era = aiResult.historicalEra || draft.formData.era;
    draft.formData.condition = aiResult.conditionGrade || draft.formData.condition;
    draft.formData.rarity = aiResult.rarity || draft.formData.rarity;
    draft.formData.description = aiResult.historicalNarrative || draft.formData.description;
    draft.formData.material = aiResult.metalComposition || draft.formData.material;
    draft.formData.weight = aiResult.weight ? Number(aiResult.weight) : draft.formData.weight;
    draft.formData.diameter = aiResult.diameter ? Number(aiResult.diameter) : draft.formData.diameter;
    draft.formData.denomination = aiResult.faceDenomination || draft.formData.denomination;
    draft.formData.mintMark = aiResult.mintMarkLocation || draft.formData.mintMark;
    draft.formData.obverseDesign = aiResult.obverseDesign || draft.formData.obverseDesign;
    draft.formData.reverseDesign = aiResult.reverseDesign || draft.formData.reverseDesign;
    if (aiResult.suggestedPriceINR) {
      draft.formData.price = Number(aiResult.suggestedPriceINR);
      draft.formData.estimatedMarketValue = Number(aiResult.suggestedPriceINR);
    }

    draft.confidence = aiResult.confidence || {};
    draft.uncertainFields = aiResult.uncertainFields || [];
    draft.missingFields = aiResult.missingFields || [];
    draft.reasoningSummary = aiResult.reasoningSummary || '';
    draft.alternativePossibilities = aiResult.alternativePossibilities || [];
    draft.rawAiOutput = aiResult;
    draft.analysisError = null;
    draft.status = determineDraftStatus(draft.formData, aiResult.confidence, aiResult.uncertainFields, aiResult.missingFields);

    analysisJobManager.updateProgress(analysisId, {
      stage: 'saving_results',
      message: 'Saving updated draft into database...',
    });

    await draft.save();

    const populated = await CoinDraft.findById(draft._id)
      .populate('formData.category', 'name slug')
      .populate('formData.country', 'name flag code')
      .populate('formData.mint', 'name mintMark location');

    analysisJobManager.updateProgress(analysisId, {
      stage: 'completed',
      status: 'completed',
      progress: 100,
      message: 'Analysis refreshed successfully!',
      draftId: populated._id,
    });

    res.json({
      message: 'Analysis refreshed successfully.',
      analysisId,
      draft: populated,
    });
  } catch (error) {
    console.error('retryDraftAnalysis error:', error);
    analysisJobManager.updateProgress(analysisId, {
      stage: 'failed',
      status: 'failed',
      error: error.message || 'Retry analysis failed',
    });
    res.status(500).json({ message: error.message || 'Retry analysis failed', analysisId });
  }
};

/**
 * POST /api/admin/ai-coins/drafts/:id/approve
 * Validate draft, upload confirmed images to Cloudinary,
 * create Coin in catalog, and update draft status to approved.
 */
const approveDraft = async (req, res) => {
  try {
    const draft = await CoinDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ message: 'Coin draft not found' });
    }

    // Protection against double-clicks and repeated approvals
    if (draft.status === 'approved' || draft.coinId) {
      return res.status(400).json({
        message: 'This draft has already been approved and registered as a marketplace product.',
        coinId: draft.coinId,
      });
    }

    // Merge any last-minute payload updates submitted with the approve request
    if (req.body.formData) {
      draft.formData = {
        ...draft.formData.toObject(),
        ...req.body.formData,
      };
    }
    if (req.body.images && Array.isArray(req.body.images)) {
      draft.images = req.body.images;
    }

    const { formData, images } = draft;

    // Strict validation before creating real product
    if (!formData.name || formData.name.trim().length < 3) {
      return res.status(400).json({ message: 'Validation Error: Artifact name must be at least 3 characters.' });
    }
    if (!formData.year || String(formData.year).trim() === '') {
      return res.status(400).json({ message: 'Validation Error: Year of issue is required.' });
    }
    if (!formData.category) {
      return res.status(400).json({ message: 'Validation Error: Category is required. Please select a category.' });
    }
    if (!formData.country) {
      return res.status(400).json({ message: 'Validation Error: Country is required. Please select a country of origin.' });
    }
    if (formData.price === null || formData.price === undefined || Number(formData.price) <= 0) {
      return res.status(400).json({ message: 'Validation Error: Selling price must be greater than ₹0.' });
    }
    if (formData.quantity === null || formData.quantity === undefined || Number(formData.quantity) < 0) {
      return res.status(400).json({ message: 'Validation Error: Valid non-negative quantity is required.' });
    }
    if (!images || images.length === 0) {
      return res.status(400).json({ message: 'Validation Error: At least one coin image is required.' });
    }

    // Reorder images so Obverse is first, Reverse is second, Details follow
    const sortedImages = [...images].sort((a, b) => {
      const order = { obverse: 0, reverse: 1, detail: 2, uncertain: 3 };
      return (order[a.role] ?? 3) - (order[b.role] ?? 3);
    });

    // Cloudinary Upload for local staged images
    const finalImageUrls = [];
    for (let i = 0; i < sortedImages.length; i++) {
      const img = sortedImages[i];
      if (img.isCloudinary && img.url.startsWith('http')) {
        finalImageUrls.push(img.url);
      } else if (img.localPath && fs.existsSync(img.localPath)) {
        try {
          const uploadRes = await uploadToCloudinary(img.localPath, 'coin_india');
          img.url = uploadRes.url;
          img.publicId = uploadRes.publicId;
          img.isCloudinary = true;
          finalImageUrls.push(uploadRes.url);
        } catch (uploadErr) {
          console.error(`Failed to upload ${img.localPath} to Cloudinary:`, uploadErr.message);
          finalImageUrls.push(img.url);
        }
      } else {
        finalImageUrls.push(img.url);
      }
    }

    // Ensure SKU is unique or assign one
    let sku = formData.sku;
    if (!sku) {
      sku = await generateUniqueSku(formData.era, formData.year);
    } else {
      const existingCoinWithSku = await Coin.findOne({ sku });
      if (existingCoinWithSku) {
        draft.status = 'approved';
        draft.coinId = existingCoinWithSku._id;
        draft.images = sortedImages;
        await draft.save();

        return res.status(200).json({
          message: 'Coin artifact was already registered with this SKU. Draft linked and approved.',
          coin: existingCoinWithSku,
          draftId: draft._id,
        });
      }
    }

    // Parse numeric year
    let numYear = parseInt(formData.year, 10);
    if (isNaN(numYear)) numYear = undefined;

    // Create the Coin document
    const coinData = {
      name: formData.name.trim(),
      sku,
      country: formData.country,
      category: formData.category,
      mint: formData.mint || undefined,
      mintMark: formData.mintMark || undefined,
      yearOfIssue: numYear,
      currency: 'INR',
      denomination: formData.denomination || undefined,
      material: formData.material || undefined,
      weight: formData.weight || undefined,
      diameter: formData.diameter || undefined,
      condition: formData.condition || 'UNC',
      rarity: formData.rarity || undefined,
      era: formData.era || 'British India',
      obverseDescription: formData.obverseDesign || undefined,
      reverseDescription: formData.reverseDesign || undefined,
      historicalSignificance: formData.description || undefined,
      sellingPrice: Number(formData.price),
      estimatedMarketValue: formData.estimatedMarketValue ? Number(formData.estimatedMarketValue) : Number(formData.price),
      quantity: Number(formData.quantity),
      isAvailable: Number(formData.quantity) > 0,
      isFeatured: !!formData.isFeatured,
      images: finalImageUrls,
    };

    const newCoin = new Coin(coinData);
    const savedCoin = await newCoin.save();

    // Update draft status and link to the created coin
    draft.status = 'approved';
    draft.coinId = savedCoin._id;
    draft.images = sortedImages;
    await draft.save();

    res.status(201).json({
      message: 'Coin successfully approved and registered into the marketplace catalog!',
      coin: savedCoin,
      draftId: draft._id,
    });
  } catch (error) {
    console.error('approveDraft error:', error);
    res.status(500).json({ message: error.message || 'Failed to approve and save coin' });
  }
};

/**
 * DELETE /api/admin/ai-coins/drafts/:id
 * Delete/discard a draft and clean up temporary files
 */
const deleteDraft = async (req, res) => {
  try {
    const draft = await CoinDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ message: 'Coin draft not found' });
    }

    // Clean up local temp files if not yet approved to Cloudinary
    if (draft.images && Array.isArray(draft.images)) {
      draft.images.forEach((img) => {
        if (img.localPath && !img.isCloudinary && fs.existsSync(img.localPath)) {
          try {
            fs.unlinkSync(img.localPath);
          } catch (e) {
            // Ignore unlink errors
          }
        }
      });
    }

    await draft.deleteOne();
    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
