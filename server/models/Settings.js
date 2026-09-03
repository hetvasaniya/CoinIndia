const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Appearance / Theme
  theme: {
    type: String,
    enum: ['dark', 'light'],
    default: 'dark'
  },
  
  // Help & Support Settings
  supportEmail: {
    type: String,
    required: true,
    default: 'support@coinindia.com',
    trim: true,
    lowercase: true
  },
  contactFormEnabled: {
    type: Boolean,
    default: true
  },
  contactFormHeading: {
    type: String,
    default: 'Get in Touch with Numismatic Support'
  },
  contactFormDescription: {
    type: String,
    default: 'Have questions about rare coin authenticity, historical provenance, or order tracking? Send us a message below.'
  },

  // Shipping & Delivery Settings
  shippingCharge: {
    type: Number,
    required: true,
    min: 0,
    default: 50
  },
  freeShippingThreshold: {
    type: Number,
    required: true,
    min: 0,
    default: 999
  },
  minDeliveryDays: {
    type: Number,
    required: true,
    min: 1,
    default: 3
  },
  maxDeliveryDays: {
    type: Number,
    required: true,
    min: 1,
    default: 7
  },

  // Privacy Policy Management
  privacyPolicyPdfUrl: {
    type: String,
    default: ''
  },
  privacyPolicyUploadedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Helper static method to get or create single settings document
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
