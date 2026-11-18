const mongoose = require('mongoose');

const coinDraftSchema = new mongoose.Schema(
  {
    analysisId: {
      type: String,
      index: true,
      default: null,
    },
    batchId: {
      type: String,
      index: true,
      default: null,
    },
    mode: {
      type: String,
      enum: ['single', 'bulk'],
      default: 'single',
    },
    status: {
      type: String,
      enum: [
        'pending_review',
        'needs_manual_review',
        'analysis_failed',
        'ready_for_approval',
        'approved',
        'rejected',
      ],
      default: 'pending_review',
      index: true,
    },
    coinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coin',
      default: null,
    },
    images: [
      {
        url: { type: String, required: true },
        localPath: { type: String },
        publicId: { type: String },
        originalName: { type: String },
        mimetype: { type: String },
        size: { type: Number },
        role: {
          type: String,
          enum: ['obverse', 'reverse', 'detail', 'uncertain'],
          default: 'uncertain',
        },
        isCloudinary: { type: Boolean, default: false },
      },
    ],
    formData: {
      name: { type: String, default: '' },
      year: { type: String, default: '' },
      sku: { type: String, default: '' },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
      },
      categorySuggestedName: { type: String, default: '' },
      country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        default: null,
      },
      countrySuggestedName: { type: String, default: '' },
      mint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mint',
        default: null,
      },
      mintSuggestedName: { type: String, default: '' },
      era: { type: String, default: 'British India' },
      condition: { type: String, default: 'UNC' },
      rarity: { type: String, default: 'Common' },
      description: { type: String, default: '' },
      material: { type: String, default: '' },
      weight: { type: Number, default: null },
      diameter: { type: Number, default: null },
      denomination: { type: String, default: '' },
      mintMark: { type: String, default: '' },
      obverseDesign: { type: String, default: '' },
      reverseDesign: { type: String, default: '' },
      price: { type: Number, default: null },
      estimatedMarketValue: { type: Number, default: null },
      quantity: { type: Number, default: 1 },
      isFeatured: { type: Boolean, default: false },
    },
    confidence: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    uncertainFields: [{ type: String }],
    missingFields: [{ type: String }],
    reasoningSummary: { type: String, default: '' },
    alternativePossibilities: [{ type: String }],
    rawAiOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    analysisError: { type: String, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CoinDraft = mongoose.model('CoinDraft', coinDraftSchema);
module.exports = CoinDraft;
