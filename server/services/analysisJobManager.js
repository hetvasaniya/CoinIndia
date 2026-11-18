/**
 * Analysis Job Manager & Real-Time Event Dispatcher
 *
 * Tracks the live lifecycle of coin analysis jobs, emits Server-Sent Events (SSE)
 * to subscribed frontend clients, calculates elapsed/remaining times based on actual
 * backend milestones, and logs performance metrics.
 */

const STAGES = {
  PREPARING_IMAGE: {
    id: 'preparing_image',
    name: 'Preparing uploaded image.',
    progress: 10,
    message: 'Preparing uploaded coin photographs...',
  },
  OPTIMIZING_IMAGE: {
    id: 'optimizing_image',
    name: 'Optimizing image quality.',
    progress: 20,
    message: 'Optimizing image dimensions and compression for Gemini Vision...',
  },
  CONNECTING_GEMINI: {
    id: 'connecting_gemini',
    name: 'Connecting to Gemini AI.',
    progress: 30,
    message: 'Connecting to Gemini AI and initializing numismatic inspection...',
  },
  IDENTIFYING_COIN: {
    id: 'identifying_coin',
    name: 'Identifying coin details.',
    progress: 45,
    message: 'Gemini is identifying coin details and ruler portraits...',
  },
  ANALYZING_DETAILS: {
    id: 'analyzing_details',
    name: 'Analyzing denomination, year, country and mint.',
    progress: 60,
    message: 'Analyzing denomination, year of issue, country of origin, and mint marks...',
  },
  ANALYZING_CONDITION: {
    id: 'analyzing_condition',
    name: 'Analyzing rarity and condition.',
    progress: 70,
    message: 'Evaluating strike quality, field wear, condition grade, and rarity...',
  },
  GENERATING_RESULTS: {
    id: 'generating_results',
    name: 'Generating structured coin information.',
    progress: 80,
    message: 'Generating structured numismatic catalog fields...',
  },
  VALIDATING_RESPONSE: {
    id: 'validating_response',
    name: 'Validating AI response.',
    progress: 90,
    message: 'Validating AI response and matching against catalog reference entities...',
  },
  SAVING_RESULTS: {
    id: 'saving_results',
    name: 'Saving analysis results.',
    progress: 95,
    message: 'Saving coin registration draft into database...',
  },
  COMPLETED: {
    id: 'completed',
    name: 'Analysis completed.',
    progress: 100,
    message: 'Analysis completed successfully! Review your draft below.',
  },
  FAILED: {
    id: 'failed',
    name: 'Analysis failed.',
    message: 'Analysis encountered an error.',
  },
};

// In-memory store of active/recent jobs: analysisId -> job
const jobs = new Map();

// SSE listeners: analysisId -> Set of response objects
const sseListeners = new Map();

// Rolling historical durations (in seconds) of completed single-coin analyses
const historicalDurations = [];
const MAX_HISTORICAL_ENTRIES = 20;
const DEFAULT_ESTIMATED_TOTAL_SECONDS = 12;

/**
 * Get estimated total duration in seconds based on historical runs
 */
const getEstimatedTotalSeconds = () => {
  if (historicalDurations.length === 0) {
    return DEFAULT_ESTIMATED_TOTAL_SECONDS;
  }
  const sum = historicalDurations.reduce((acc, val) => acc + val, 0);
  return Math.max(3, Math.round(sum / historicalDurations.length));
};

/**
 * Record a completed analysis duration for future remaining time estimates
 */
const recordCompletedDuration = (seconds) => {
  if (typeof seconds === 'number' && seconds > 0) {
    historicalDurations.push(seconds);
    if (historicalDurations.length > MAX_HISTORICAL_ENTRIES) {
      historicalDurations.shift();
    }
  }
};

/**
 * Create or initialize a new analysis job
 */
const createJob = (analysisId, userId = null) => {
  const now = Date.now();
  const job = {
    analysisId,
    userId: userId ? String(userId) : null,
    stage: STAGES.PREPARING_IMAGE.id,
    stageName: STAGES.PREPARING_IMAGE.name,
    progress: STAGES.PREPARING_IMAGE.progress,
    status: 'processing', // 'processing' | 'completed' | 'failed'
    message: STAGES.PREPARING_IMAGE.message,
    startTime: now,
    elapsedSeconds: 0,
    estimatedRemainingSeconds: Math.round(getEstimatedTotalSeconds() * 0.9),
    hasHistoricalData: historicalDurations.length > 0,
    draftId: null,
    coinId: null,
    error: null,
    timing: {
      imagePreparationMs: 0,
      geminiApiResponseMs: 0,
      jsonParsingMs: 0,
      validationMs: 0,
      databaseSaveMs: 0,
      totalDurationMs: 0,
    },
    createdAt: now,
    lastUpdated: now,
  };

  jobs.set(analysisId, job);
  broadcastJobUpdate(job);
  return job;
};

/**
 * Get job state
 */
const getJob = (analysisId) => {
  return jobs.get(analysisId) || null;
};

/**
 * Build the standardized progress event payload matching Section 5
 */
const formatEvent = (job) => {
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - job.startTime) / 1000));
  const estimatedTotal = getEstimatedTotalSeconds();

  let estimatedRemainingSeconds = 0;
  if (job.status === 'processing') {
    const fractionRemaining = Math.max(0.05, 1 - job.progress / 100);
    // Baseline remaining estimation
    const roughEstimate = Math.round(estimatedTotal * fractionRemaining);
    // If elapsed is already taking longer than average, provide dynamic decay
    estimatedRemainingSeconds = Math.max(1, roughEstimate);
  }

  return {
    analysisId: job.analysisId,
    stage: job.stage,
    stageName: job.stageName,
    progress: job.progress,
    status: job.status,
    elapsedSeconds,
    estimatedRemainingSeconds,
    hasHistoricalData: historicalDurations.length > 0,
    message: job.message,
    draftId: job.draftId || null,
    error: job.error || null,
    timing: job.timing || null,
  };
};

/**
 * Broadcast event to all SSE subscribers listening to this job
 */
const broadcastJobUpdate = (job) => {
  const payload = formatEvent(job);
  const clients = sseListeners.get(job.analysisId);

  if (clients && clients.size > 0) {
    const dataString = `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of clients) {
      try {
        res.write(dataString);
      } catch (err) {
        // Handled on close
      }
    }
  }

  return payload;
};

/**
 * Update the stage or progress of an active job
 */
const updateProgress = (analysisId, updates = {}) => {
  let job = jobs.get(analysisId);
  if (!job) {
    job = createJob(analysisId, updates.userId);
  }

  const stageDef = Object.values(STAGES).find((s) => s.id === updates.stage);

  if (updates.stage) job.stage = updates.stage;
  if (updates.stageName) {
    job.stageName = updates.stageName;
  } else if (stageDef?.name) {
    job.stageName = stageDef.name;
  }

  if (typeof updates.progress === 'number') {
    job.progress = updates.progress;
  } else if (stageDef?.progress !== undefined) {
    job.progress = stageDef.progress;
  }

  if (updates.message) {
    job.message = updates.message;
  } else if (stageDef?.message) {
    job.message = stageDef.message;
  }

  if (updates.status) job.status = updates.status;
  if (updates.draftId) job.draftId = updates.draftId;
  if (updates.coinId) job.coinId = updates.coinId;
  if (updates.error) job.error = updates.error;

  if (updates.timing) {
    job.timing = { ...job.timing, ...updates.timing };
  }

  job.lastUpdated = Date.now();
  job.elapsedSeconds = Math.max(0, Math.round((job.lastUpdated - job.startTime) / 1000));

  // If completed, record duration to historical benchmark
  if (job.status === 'completed') {
    recordCompletedDuration(job.elapsedSeconds);
    job.estimatedRemainingSeconds = 0;
    job.progress = 100;
  }

  const eventPayload = broadcastJobUpdate(job);

  // If terminal status, notify and schedule cleanup
  if (job.status === 'completed' || job.status === 'failed') {
    const clients = sseListeners.get(analysisId);
    if (clients) {
      // Allow final packet to flush then close gracefully
      setTimeout(() => {
        for (const res of clients) {
          try {
            res.end();
          } catch (e) {}
        }
        sseListeners.delete(analysisId);
      }, 500);
    }
  }

  return eventPayload;
};

/**
 * Register an SSE client connection for an analysis job
 */
const registerSseClient = (analysisId, res, reqUser = null) => {
  let clients = sseListeners.get(analysisId);
  if (!clients) {
    clients = new Set();
    sseListeners.set(analysisId, clients);
  }
  clients.add(res);

  // Send initial state immediately so client gets current stage
  const job = getJob(analysisId);
  if (job) {
    res.write(`data: ${JSON.stringify(formatEvent(job))}\n\n`);
  } else {
    // Send initial placeholder
    res.write(
      `data: ${JSON.stringify({
        analysisId,
        stage: STAGES.PREPARING_IMAGE.id,
        stageName: STAGES.PREPARING_IMAGE.name,
        progress: 5,
        status: 'processing',
        elapsedSeconds: 0,
        estimatedRemainingSeconds: getEstimatedTotalSeconds(),
        hasHistoricalData: historicalDurations.length > 0,
        message: 'Initializing analysis pipeline...',
      })}\n\n`
    );
  }

  // Heartbeat comment every 15s to keep connection open through reverse proxies
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      clearInterval(heartbeatTimer);
    }
  }, 15000);

  // Clean up on disconnect
  const cleanup = () => {
    clearInterval(heartbeatTimer);
    const set = sseListeners.get(analysisId);
    if (set) {
      set.delete(res);
      if (set.size === 0) sseListeners.delete(analysisId);
    }
  };

  res.on('close', cleanup);
  res.on('finish', cleanup);
};

// Periodically purge old jobs from memory (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.lastUpdated < oneHourAgo) {
      jobs.delete(id);
      sseListeners.delete(id);
    }
  }
}, 10 * 60 * 1000);

module.exports = {
  STAGES,
  createJob,
  getJob,
  updateProgress,
  formatEvent,
  registerSseClient,
  getEstimatedTotalSeconds,
};
