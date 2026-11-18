const mongoose = require('mongoose');
const slugify = require('slugify');
const crypto = require('crypto');

const coinSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, trim: true },
    slug: { type: String, unique: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
    currency: { type: String },
    denomination: { type: String },
    yearOfIssue: { type: Number },
    mint: { type: mongoose.Schema.Types.ObjectId, ref: 'Mint' },
    mintMark: { type: String },
    material: { type: String },
    weight: { type: Number }, // in grams
    diameter: { type: Number }, // in mm
    thickness: { type: Number }, // in mm
    shape: { type: String },
    obverseDescription: { type: String },
    reverseDescription: { type: String },
    edgeType: { type: String },
    mintage: { type: Number },
    condition: { type: String },
    rarity: { type: String },
    historicalSignificance: { type: String },
    issuingAuthority: { type: String },
    sellingPrice: { type: Number, required: true },
    estimatedMarketValue: { type: Number },
    images: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    isCommemorativeEdition: { type: Boolean, default: false },
    commemorativeInfo: { type: String },
    isFeatured: { type: Boolean, default: false },
    quantity: { type: Number, required: true, default: 0 },
    isAvailable: { type: Boolean, default: true },
    era: { type: String },
    provenance: { type: String },
  },
  { timestamps: true }
);

coinSchema.index({ name: 'text', historicalSignificance: 'text' });

coinSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isModified('yearOfIssue') || !this.slug) {
    const rawString = `${this.name || ''} ${this.yearOfIssue !== undefined && this.yearOfIssue !== null ? this.yearOfIssue : ''}`.trim();
    let baseSlug = slugify(rawString, { lower: true, strict: true }) || 'coin';

    const CoinModel = this.constructor;
    let candidateSlug = baseSlug;
    let counter = 1;

    // Guarantee slug uniqueness across all existing coin artifacts
    while (true) {
      const existing = await CoinModel.findOne({
        slug: candidateSlug,
        _id: { $ne: this._id },
      }).select('_id');

      if (!existing) {
        this.slug = candidateSlug;
        break;
      }

      counter++;
      if (counter <= 100) {
        candidateSlug = `${baseSlug}-${counter}`;
      } else {
        const randomSuffix = crypto.randomBytes(2).toString('hex');
        candidateSlug = `${baseSlug}-${randomSuffix}`;
      }
    }
  }

  if (this.isModified('quantity')) {
    this.isAvailable = this.quantity > 0;
  }

  if (typeof next === 'function') {
    next();
  }
});

const Coin = mongoose.model('Coin', coinSchema);
module.exports = Coin;
