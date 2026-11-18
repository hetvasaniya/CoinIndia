const crypto = require('crypto');
const Coin = require('../models/Coin');
const CoinDraft = require('../models/CoinDraft');

/**
 * Generate a collision-free unique SKU
 * Format: COIN-<ERA_CODE>-<YEAR>-<4_HEX>
 */
const generateUniqueSku = async (era, year) => {
  const eraCodeMap = {
    'British India': 'BI',
    'Republic of India': 'ROI',
    'Mughal': 'MUG',
    'Ancient': 'ANC',
    'Medieval': 'MED',
    'Foreign': 'FOR',
  };

  const eraCode = eraCodeMap[era] || 'GEN';
  const cleanYear = (year || 'ND').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) || 'XXXX';

  let isUnique = false;
  let candidateSku = '';
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    candidateSku = `COIN-${eraCode}-${cleanYear}-${randomSuffix}`;

    const existingCoin = await Coin.findOne({ sku: candidateSku });
    const existingDraft = await CoinDraft.findOne({ 'formData.sku': candidateSku });

    if (!existingCoin && !existingDraft) {
      isUnique = true;
    }
  }

  return candidateSku;
};

/**
 * Fuzzy/exact match AI suggestions against existing DB entities
 */
const matchCatalogEntities = (aiResult, categories = [], countries = [], mints = []) => {
  let matchedCategory = null;
  let matchedCountry = null;
  let matchedMint = null;

  const normalize = (str) => (str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

  // 1. Match Category
  const catQuery = normalize(aiResult.categorySuggestedName || aiResult.historicalEra);
  if (catQuery) {
    matchedCategory = categories.find((c) => {
      const cName = normalize(c.name);
      const cSlug = normalize(c.slug);
      return cName === catQuery || cSlug === catQuery || cName.includes(catQuery) || catQuery.includes(cName);
    });
  }

  // 2. Match Country
  const countryQuery = normalize(aiResult.countrySuggestedName);
  if (countryQuery) {
    matchedCountry = countries.find((c) => {
      const cName = normalize(c.name);
      const cCode = normalize(c.code);
      return cName === countryQuery || cCode === countryQuery || cName.includes(countryQuery) || countryQuery.includes(cName);
    });
  }
  // Default to India or British India if country not explicitly matched
  if (!matchedCountry && countries.length > 0) {
    if (aiResult.historicalEra === 'British India') {
      matchedCountry = countries.find((c) => normalize(c.name).includes('british')) || countries[0];
    } else {
      matchedCountry = countries.find((c) => normalize(c.name) === 'india') || countries[0];
    }
  }

  // 3. Match Mint
  const mintQuery = normalize(aiResult.mintOfOrigin);
  if (mintQuery) {
    matchedMint = mints.find((m) => {
      const mName = normalize(m.name);
      const mLocation = normalize(m.location);
      return mName === mintQuery || mLocation === mintQuery || mName.includes(mintQuery) || mintQuery.includes(mName);
    });
  }

  return {
    category: matchedCategory ? matchedCategory._id : null,
    categoryName: matchedCategory ? matchedCategory.name : aiResult.categorySuggestedName || '',
    country: matchedCountry ? matchedCountry._id : null,
    countryName: matchedCountry ? matchedCountry.name : aiResult.countrySuggestedName || '',
    mint: matchedMint ? matchedMint._id : null,
    mintName: matchedMint ? matchedMint.name : aiResult.mintOfOrigin || '',
  };
};

/**
 * Determine draft review status based on completeness and confidence
 */
const determineDraftStatus = (formData, confidence = {}, uncertainFields = [], missingFields = []) => {
  const required = ['name', 'year', 'category', 'country', 'condition', 'era'];
  const hasAllRequired = required.every((field) => !!formData[field]);

  const overallConfidence = typeof confidence.overall === 'number' ? confidence.overall : 0.8;

  if (!hasAllRequired || overallConfidence < 0.65 || uncertainFields.length > 3 || missingFields.length > 2) {
    return 'needs_manual_review';
  }

  return 'ready_for_approval';
};

module.exports = {
  generateUniqueSku,
  matchCatalogEntities,
  determineDraftStatus,
};
