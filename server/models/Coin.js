const mongoose = require('mongoose');
const slugify = require('slugify');

const coinSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
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

coinSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isModified('yearOfIssue')) {
    const slugString = `${this.name} ${this.yearOfIssue || ''}`;
    this.slug = slugify(slugString, { lower: true, strict: true });
  }
  if (this.isModified('quantity')) {
    this.isAvailable = this.quantity > 0;
  }
  next();
});

const Coin = mongoose.model('Coin', coinSchema);
module.exports = Coin;
