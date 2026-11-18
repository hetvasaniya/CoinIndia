const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { optimizeBatchImagesForAi } = require('./imageOptimizer');

// ─────────────────────────────────────────────────────────────
//  Configuration Constants
// ─────────────────────────────────────────────────────────────

const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';

/** Per-attempt request timeout in milliseconds (25 s for Flash models) */
const REQUEST_TIMEOUT_MS = 25_000;

/** Primary model: max 2 attempts. Fallback model: max 1 attempt. */
const PRIMARY_MAX_ATTEMPTS = 2;
const FALLBACK_MAX_ATTEMPTS = 1;

/** Exponential backoff: 800ms -> 1200ms */
const INITIAL_DELAY_MS = 800;
const BACKOFF_FACTOR = 1.5;

/** HTTP status codes that are temporary and qualify for retry */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

// ─────────────────────────────────────────────────────────────
//  API Key Validation
// ─────────────────────────────────────────────────────────────

const validateApiKey = (key) => {
  if (!key || typeof key !== 'string') {
    return { valid: false, reason: 'GEMINI_API_KEY is not configured.' };
  }

  const trimmed = key.trim();

  if (
    !trimmed ||
    trimmed === 'your_gemini_api_key' ||
    trimmed.startsWith('your_') ||
    trimmed.includes('dummy') ||
    trimmed.includes('placeholder')
  ) {
    return { valid: false, reason: 'GEMINI_API_KEY contains a placeholder value.' };
  }

  const isLegacyKey = trimmed.startsWith('AIza');
  const isNewKey = trimmed.startsWith('AQ.');

  if (!isLegacyKey && !isNewKey) {
    return { valid: false, reason: 'Unrecognized API key format. Check your Google AI Studio key.' };
  }

  return { valid: true };
};

const isConfiguredApiKey = (key) => validateApiKey(key).valid;

const getModelName = () => process.env.GEMINI_MODEL || PRIMARY_MODEL;

// ─────────────────────────────────────────────────────────────
//  @google/genai Client
// ─────────────────────────────────────────────────────────────

let _genAIClient = null;

const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  const check = validateApiKey(apiKey);
  if (!check.valid) throw new Error(check.reason);

  if (!_genAIClient) {
    _genAIClient = new GoogleGenAI({ apiKey: apiKey.trim() });
  }
  return _genAIClient;
};

// ─────────────────────────────────────────────────────────────
//  Error Classification
// ─────────────────────────────────────────────────────────────

const getErrorStatus = (error) => {
  if (!error) return null;
  if (typeof error.status === 'number') return error.status;
  if (typeof error.statusCode === 'number') return error.statusCode;
  if (error.response && typeof error.response.status === 'number') return error.response.status;

  if (error.status && !isNaN(Number(error.status))) return Number(error.status);
  if (error.statusCode && !isNaN(Number(error.statusCode))) return Number(error.statusCode);

  if (typeof error.message === 'string') {
    const bracketMatch = error.message.match(/\[(?:GoogleGenerativeAI Error\]:\s*)?(\d{3})\b/);
    if (bracketMatch) return parseInt(bracketMatch[1], 10);
    const httpMatch = error.message.match(/\b(?:status(?:Code)?[:\s]+)?(400|401|403|404|429|500|502|503|504)\b/i);
    if (httpMatch) return parseInt(httpMatch[1], 10);
  }

  return null;
};

const isPermanentError = (error) => {
  if (!error) return false;

  const status = getErrorStatus(error);
  if (status !== null && status >= 400 && status < 500 && status !== 429) return true;

  const msg = (error.message || '').toLowerCase();

  if (
    msg.includes('api_key') || msg.includes('api key') ||
    msg.includes('unauthenticated') || msg.includes('unauthorized') ||
    msg.includes('permission_denied') || msg.includes('permission denied')
  ) return true;

  if (
    msg.includes('not found') || msg.includes('is not supported') ||
    msg.includes('unsupported model')
  ) return true;

  if (
    msg.includes('invalid argument') || msg.includes('malformed') ||
    msg.includes('bad request')
  ) return true;

  return false;
};

const isRetryableError = (error) => {
  if (!error) return false;
  if (isPermanentError(error)) return false;

  const status = getErrorStatus(error);
  if (status !== null) return RETRYABLE_STATUS_CODES.has(status);

  const msg = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();

  if (
    name === 'aborterror' || name === 'timeouterror' || name === 'fetcherror' ||
    msg.includes('aborted') || msg.includes('abort') ||
    msg.includes('service unavailable') || msg.includes('overloaded') ||
    msg.includes('resource_exhausted') || msg.includes('exhausted') ||
    msg.includes('quota') || msg.includes('too many requests') ||
    msg.includes('rate limit') || msg.includes('fetch failed') ||
    msg.includes('econnreset') || msg.includes('etimedout') ||
    msg.includes('enotfound') || msg.includes('econnrefused') ||
    msg.includes('socket hang up') || msg.includes('network') ||
    msg.includes('gateway timeout') || msg.includes('internal error') ||
    msg.includes('timed out') || msg.includes('timeout')
  ) return true;

  return false;
};

const isAuthError = (error) => {
  if (!error) return false;
  const status = getErrorStatus(error);
  if (status === 401 || status === 403) return true;
  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('gemini_api_key') || msg.includes('api_key') ||
    msg.includes('api key') || msg.includes('unauthenticated') ||
    msg.includes('permission_denied')
  );
};

const classifyError = (error) => {
  if (!error) return 'unknown';
  const msg = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();

  if (name === 'aborterror' || msg.includes('abort') || msg.includes('timed out') || msg.includes('timeout')) return 'TIMEOUT';
  if (msg.includes('fetch failed') || msg.includes('econnreset') || msg.includes('enotfound') || msg.includes('socket hang up')) return 'NETWORK';
  if (msg.includes('etimedout') || msg.includes('econnrefused')) return 'NETWORK';
  if (isAuthError(error)) return 'AUTH';

  const status = getErrorStatus(error);
  if (status === 429) return 'RATE_LIMIT';
  if (status === 503 || msg.includes('overloaded') || msg.includes('unavailable')) return 'OVERLOADED';
  if (status === 404 || msg.includes('not found')) return 'MODEL_NOT_FOUND';
  if (status !== null && status >= 500) return `SERVER_${status}`;
  if (status !== null && status >= 400) return `CLIENT_${status}`;

  return 'UNKNOWN';
};

// ─────────────────────────────────────────────────────────────
//  Retry Helper with Per-Attempt Timeout
// ─────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (fn, options = {}) => {
  const {
    maxAttempts = PRIMARY_MAX_ATTEMPTS,
    initialDelayMs = INITIAL_DELAY_MS,
    backoffFactor = BACKOFF_FACTOR,
    timeoutMs = REQUEST_TIMEOUT_MS,
    operationName = 'Gemini API call',
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptStart = Date.now();
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);

    try {
      const result = await fn(attempt, ac.signal);
      clearTimeout(timer);

      const durationMs = Date.now() - attemptStart;
      console.log(
        `[${operationName}] Attempt ${attempt}/${maxAttempts} succeeded in ${durationMs}ms.`
      );
      return result;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;

      const durationMs = Date.now() - attemptStart;
      const errorType = classifyError(error);
      const retryable = isRetryableError(error);

      // Do NOT retry permanent errors or if max attempts reached
      if (!retryable || attempt >= maxAttempts) {
        console.error(
          `[${operationName}] Attempt ${attempt}/${maxAttempts} FAILED after ${durationMs}ms – ` +
          `type=${errorType} retryable=${retryable} message="${error.message}"`
        );
        throw error;
      }

      const delay = Math.round(initialDelayMs * Math.pow(backoffFactor, attempt - 1));
      console.warn(
        `[${operationName}] Attempt ${attempt}/${maxAttempts} failed after ${durationMs}ms – ` +
        `type=${errorType} message="${error.message}". Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError;
};

// ─────────────────────────────────────────────────────────────
//  Image Helpers (Buffer & File Parts)
// ─────────────────────────────────────────────────────────────

const bufferToGenerativePart = (buffer, mimeType = 'image/jpeg') => {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType || 'image/jpeg',
    },
  };
};

const fileToGenerativePart = (filePath, mimeType) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Image file not found at: ${filePath}`);
  }
  const fileData = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: fileData.toString('base64'),
      mimeType: mimeType || 'image/jpeg',
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  JSON Response Parser
// ─────────────────────────────────────────────────────────────

const cleanAndParseJSON = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty response received from Gemini API');
  }

  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sub = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sub);
      } catch (innerErr) {
        throw new Error(`Failed to parse Gemini JSON output: ${innerErr.message}`);
      }
    }
    throw new Error(`Invalid JSON format in Gemini response: ${err.message}`);
  }
};

// ─────────────────────────────────────────────────────────────
//  Core: Call Gemini with Streaming & Fallback
// ─────────────────────────────────────────────────────────────

const callGeminiWithFallback = async (operationLabel, prompt, imageParts, onProgress = null) => {
  const genAI = getGenAIClient();
  const primaryModelName = getModelName();

  const totalStart = Date.now();
  let responseText;

  // Handler for executing model inference (streaming with non-streaming fallback)
  const executeModel = async (modelName, signal) => {
    // 1. Try streaming for real-time progress callbacks
    if (typeof genAI.models.generateContentStream === 'function') {
      try {
        const streamResult = await genAI.models.generateContentStream({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            httpOptions: { timeout: REQUEST_TIMEOUT_MS },
            abortSignal: signal,
          },
        });

        let accumulated = '';
        let stageStep = 0;

        for await (const chunk of streamResult) {
          const chunkText = chunk.text || '';
          accumulated += chunkText;

          if (onProgress && typeof onProgress === 'function') {
            if (stageStep === 0 && accumulated.length > 20) {
              stageStep = 1;
              onProgress('identifying_coin');
            } else if (stageStep === 1 && (accumulated.includes('denomination') || accumulated.includes('yearOfIssue') || accumulated.includes('countrySuggestedName'))) {
              stageStep = 2;
              onProgress('analyzing_details');
            } else if (stageStep === 2 && (accumulated.includes('rarity') || accumulated.includes('conditionGrade') || accumulated.includes('metalComposition'))) {
              stageStep = 3;
              onProgress('analyzing_condition');
            } else if (stageStep === 3 && accumulated.length > 350) {
              stageStep = 4;
              onProgress('generating_results');
            }
          }
        }

        if (accumulated && accumulated.trim()) {
          return accumulated;
        }
      } catch (streamErr) {
        console.warn(`[${operationLabel}] Streaming error on ${modelName}, falling back to non-stream:`, streamErr.message);
      }
    }

    // 2. Standard direct content generation
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        httpOptions: { timeout: REQUEST_TIMEOUT_MS },
        abortSignal: signal,
      },
    });

    const text = result.text;
    if (!text) throw new Error('Gemini returned empty response text');
    if (onProgress && typeof onProgress === 'function') {
      onProgress('generating_results');
    }
    return text;
  };

  // 1. Primary Model (max 2 attempts)
  try {
    responseText = await withRetry(
      async (_attempt, signal) => executeModel(primaryModelName, signal),
      {
        operationName: `${operationLabel}:primary(${primaryModelName})`,
        maxAttempts: PRIMARY_MAX_ATTEMPTS,
        timeoutMs: REQUEST_TIMEOUT_MS,
      }
    );

    const totalMs = Date.now() - totalStart;
    console.log(
      `[${operationLabel}] ✓ SUCCESS with primary model ${primaryModelName} in ${totalMs}ms total.`
    );
    return responseText;
  } catch (primaryError) {
    const totalMs = Date.now() - totalStart;
    const primaryType = classifyError(primaryError);
    console.warn(
      `[${operationLabel}] Primary model ${primaryModelName} failed after ${totalMs}ms – ` +
      `type=${primaryType} message="${primaryError.message}"`
    );

    // If error is permanent (auth, 400, model not found) or already fallback, DO NOT attempt fallback
    if (
      isAuthError(primaryError) ||
      isPermanentError(primaryError) ||
      primaryModelName === FALLBACK_MODEL
    ) {
      console.error(`[${operationLabel}] No fallback attempted (permanent error or already fallback model).`);
      throw new Error(`Gemini API Error: ${primaryError.message}`);
    }

    // 2. Fallback Model (max 1 attempt, only on retryable server failures)
    console.warn(
      `[${operationLabel}] Attempting fallback model ${FALLBACK_MODEL} (max ${FALLBACK_MAX_ATTEMPTS} attempts)...`
    );

    try {
      responseText = await withRetry(
        async (_attempt, signal) => executeModel(FALLBACK_MODEL, signal),
        {
          operationName: `${operationLabel}:fallback(${FALLBACK_MODEL})`,
          maxAttempts: FALLBACK_MAX_ATTEMPTS,
          timeoutMs: REQUEST_TIMEOUT_MS,
        }
      );

      const totalMs2 = Date.now() - totalStart;
      console.log(
        `[${operationLabel}] ✓ SUCCESS with fallback model ${FALLBACK_MODEL} in ${totalMs2}ms total.`
      );
      return responseText;
    } catch (fallbackError) {
      const totalMs2 = Date.now() - totalStart;
      const fallbackType = classifyError(fallbackError);
      console.error(
        `[${operationLabel}] Fallback model ${FALLBACK_MODEL} also failed after ${totalMs2}ms total – ` +
        `type=${fallbackType} message="${fallbackError.message}". ` +
        `Original primary error: type=${primaryType} message="${primaryError.message}"`
      );

      const combinedError = new Error(
        `AI analysis temporarily unavailable. ` +
        `Primary model (${primaryModelName}): ${primaryError.message}. ` +
        `Fallback model (${FALLBACK_MODEL}): ${fallbackError.message}. ` +
        `Please try again in a few moments.`
      );
      combinedError.primaryError = primaryError;
      combinedError.fallbackError = fallbackError;
      throw combinedError;
    }
  }
};

// ─────────────────────────────────────────────────────────────
//  Prompts (Optimized for Fast Structured JSON Output)
// ─────────────────────────────────────────────────────────────

const buildSingleCoinPrompt = (catalogContext) => {
  const categoryNames = (catalogContext.categories || []).map((c) => c.name).join(', ');
  const countryNames = (catalogContext.countries || []).map((c) => c.name).join(', ');
  const mintNames = (catalogContext.mints || []).map((m) => `${m.name} (${m.mintMark || 'no mark'})`).join(', ');

  return `You are a world-class professional numismatic expert for Coinomart rare coin marketplace.
Analyze the provided photograph(s) of a coin artifact and extract precise catalog details.

Diagnostic Examination Priorities:
1. Inscriptions & Scripts: Devanagari, Persian/Nastaliq, Latin, Urdu, etc.
2. Ruler/Monarch: Queen Victoria, Edward VII, George V/VI, Mughal emperors, ancient dynasties.
3. Denomination & Year: (e.g. 1 Rupee, 1/2 Anna, Mohur). Extract CE or Samvat/AH year.
4. Mint marks: Calcutta (none), Bombay (diamond/bead/dot), Hyderabad (split diamond/star), Lahore (L), Noida (round dot).
5. Strike, condition grade & metal composition.
6. Determine Front (Obverse) vs. Back (Reverse) index (0-based).

CRITICAL CONSTRAINTS:
- Keep text fields concise to minimize generation latency.
- Return ONLY valid JSON matching the exact schema below without markdown commentary.
- If uncertain about any detail, set that field to null or "" and list it in "uncertainFields".

Available Categories: [${categoryNames || 'Indian, British India, Royal & Ancient, World'}]
Available Countries: [${countryNames || 'India, British India, Princely States'}]
Available Mints: [${mintNames || 'Mumbai Mint, Kolkata Mint, Hyderabad Mint, Noida Mint'}]
Standard Eras: ["Ancient", "Medieval", "Mughal", "British India", "Republic of India", "Foreign"]
Standard Grades: ["UNC", "XF", "VF", "F", "VG", "G"]

Return ONLY this JSON object:
{
  "artifactName": "Full descriptive title (e.g., 1862 Queen Victoria One Rupee (Calcutta Mint, Silver))",
  "yearOfIssue": "Year as string (e.g. 1862)",
  "categorySuggestedName": "Name of best matching category from available list",
  "historicalEra": "One of: Ancient, Medieval, Mughal, British India, Republic of India, Foreign",
  "countrySuggestedName": "Name of best matching country from available list",
  "conditionGrade": "One of: UNC, XF, VF, F, VG, G",
  "rarity": "One of: Common, Scarce, Rare, Very Rare, Extremely Rare",
  "historicalNarrative": "A concise 1-2 paragraph numismatic summary covering historical context and significance (under 60 words)",
  "metalComposition": "Specific metal/alloy (e.g. Silver (.917), Copper, Gold)",
  "weight": null or standard weight in grams as number,
  "diameter": null or standard diameter in mm as number,
  "faceDenomination": "Face value (e.g. 1 Rupee, 1/2 Anna)",
  "mintOfOrigin": "Mint name (e.g. Calcutta, Bombay)",
  "mintMarkLocation": "Mint mark description and location",
  "obverseDesign": "Concise 1-sentence visual description of front engraving",
  "reverseDesign": "Concise 1-sentence visual description of back engraving",
  "suggestedPriceINR": conservative estimated market value in INR as number or null,
  "obverseImageIndex": 0-based integer index of obverse image (or null if uncertain),
  "reverseImageIndex": 0-based integer index of reverse image (or null if uncertain),
  "imageRoles": [
    { "index": 0, "role": "obverse"|"reverse"|"detail"|"uncertain", "confidence": 0.95 }
  ],
  "confidence": {
    "overall": 0.9,
    "name": 0.95,
    "year": 0.9,
    "era": 0.95,
    "denomination": 0.9,
    "metal": 0.85,
    "mint": 0.8,
    "condition": 0.85
  },
  "uncertainFields": [],
  "missingFields": [],
  "alternativePossibilities": [],
  "reasoningSummary": "1 concise sentence stating key markers (e.g. mint mark, bust type, date)"
}`;
};

const buildBulkCoinPrompt = (imageFiles, catalogContext) => {
  const categoryNames = (catalogContext.categories || []).map((c) => c.name).join(', ');
  const countryNames = (catalogContext.countries || []).map((c) => c.name).join(', ');
  const mintNames = (catalogContext.mints || []).map((m) => `${m.name} (${m.mintMark || 'no mark'})`).join(', ');
  const imageIndexList = imageFiles
    .map((img, idx) => `Image Index ${idx}: filename="${img.originalName}"`)
    .join('\n');

  return `You are a world-class professional numismatic expert for Coinomart.
Group and identify coin artifacts from this batch of ${imageFiles.length} photographs.

Tasks:
1. CLUSTERING: Group images of the SAME physical coin (obverse/reverse pairs, detail shots).
2. For each identified artifact, extract structured numismatic catalog fields. Keep narratives concise.

Images provided (0-based indices):
${imageIndexList}

Available Categories: [${categoryNames || 'Indian, British India, Royal & Ancient, World'}]
Available Countries: [${countryNames || 'India, British India, Princely States'}]
Available Mints: [${mintNames || 'Mumbai Mint, Kolkata Mint, Hyderabad Mint, Noida Mint'}]
Standard Eras: ["Ancient", "Medieval", "Mughal", "British India", "Republic of India", "Foreign"]
Standard Grades: ["UNC", "XF", "VF", "F", "VG", "G"]

Return ONLY this JSON object:
{
  "artifacts": [
    {
      "artifactGroupIndex": 0,
      "imageIndices": [0, 1],
      "obverseImageIndex": 0,
      "reverseImageIndex": 1,
      "imageRoles": [
        { "index": 0, "role": "obverse", "confidence": 0.95 },
        { "index": 1, "role": "reverse", "confidence": 0.95 }
      ],
      "artifactName": "Full descriptive title",
      "yearOfIssue": "Year string",
      "categorySuggestedName": "Category name from list",
      "historicalEra": "One of: Ancient, Medieval, Mughal, British India, Republic of India, Foreign",
      "countrySuggestedName": "Country name from list",
      "conditionGrade": "One of: UNC, XF, VF, F, VG, G",
      "historicalNarrative": "A concise 1-2 paragraph numismatic summary",
      "metalComposition": "Metal name",
      "weight": null or standard weight as number,
      "diameter": null or standard diameter as number,
      "faceDenomination": "Denomination",
      "mintOfOrigin": "Mint name",
      "mintMarkLocation": "Mint mark description",
      "obverseDesign": "Concise visual description of front",
      "reverseDesign": "Concise visual description of back",
      "suggestedPriceINR": number or null,
      "confidence": { "overall": 0.9, "name": 0.9, "year": 0.9, "grouping": 0.95 },
      "uncertainFields": [],
      "missingFields": [],
      "alternativePossibilities": [],
      "reasoningSummary": "1 concise sentence stating key diagnostic markers"
    }
  ],
  "unmatchedImageIndices": [],
  "duplicateImageIndices": [],
  "batchSummary": "Brief overview of coins identified"
}`;
};

// ─────────────────────────────────────────────────────────────
//  Public Analysis Functions
// ─────────────────────────────────────────────────────────────

const analyzeSingleCoin = async (imageFiles, catalogContext = {}, onProgress = null) => {
  // 1. Optimize images concurrently for fast transmission and visual inference
  const optimizedList = await optimizeBatchImagesForAi(imageFiles);
  const imageParts = optimizedList.map((opt) => bufferToGenerativePart(opt.buffer, opt.mimeType));

  const prompt = buildSingleCoinPrompt(catalogContext);
  const responseText = await callGeminiWithFallback('analyzeSingleCoin', prompt, imageParts, onProgress);
  return cleanAndParseJSON(responseText);
};

const analyzeBulkCoins = async (imageFiles, catalogContext = {}, onProgress = null) => {
  // 1. Optimize images concurrently
  const optimizedList = await optimizeBatchImagesForAi(imageFiles);
  const imageParts = optimizedList.map((opt) => bufferToGenerativePart(opt.buffer, opt.mimeType));

  const prompt = buildBulkCoinPrompt(imageFiles, catalogContext);
  const responseText = await callGeminiWithFallback('analyzeBulkCoins', prompt, imageParts, onProgress);
  return cleanAndParseJSON(responseText);
};

// ─────────────────────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────────────────────

module.exports = {
  analyzeSingleCoin,
  analyzeBulkCoins,
  cleanAndParseJSON,
  isConfiguredApiKey,
  validateApiKey,
  getGenAIClient,
  withRetry,
  isRetryableError,
  isPermanentError,
  getErrorStatus,
  classifyError,
  fileToGenerativePart,
  bufferToGenerativePart,
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  getModelName,
  REQUEST_TIMEOUT_MS,
  PRIMARY_MAX_ATTEMPTS,
  FALLBACK_MAX_ATTEMPTS,
};
