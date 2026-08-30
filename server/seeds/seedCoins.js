const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Country = require('../models/Country');
const Mint = require('../models/Mint');
const Coin = require('../models/Coin');

dotenv.config();
connectDB();

const seedDatabase = async () => {
  try {
    // Clear existing data
    await Category.deleteMany({});
    await Country.deleteMany({});
    await Mint.deleteMany({});
    await Coin.deleteMany({});

    console.log('Cleared existing catalog data.');

    // Seed Countries
    const india = await Country.create({ name: 'India', code: 'IN', flag: '🇮🇳' });
    const britishIndia = await Country.create({ name: 'British India', code: 'BI', flag: '🇬🇧' });
    const princelyStates = await Country.create({ name: 'Princely States', code: 'PS', flag: '👑' });

    // Seed Categories
    const republicIndia = await Category.create({ name: 'Indian', slug: 'indian', description: 'Republic of India Coinage' });
    const colonial = await Category.create({ name: 'British India', slug: 'british-india', description: 'British Colonial Currency' });
    const royal = await Category.create({ name: 'Royal & Ancient', slug: 'royal', description: 'Ancient Indian Dynasties & Empires' });

    // Seed Mints
    const mumbai = await Mint.create({ name: 'Mumbai Mint', location: 'Mumbai', country: india._id, mintMark: 'Diamond (◆)' });
    const kolkata = await Mint.create({ name: 'Kolkata Mint', location: 'Kolkata', country: india._id, mintMark: 'No Mark' });
    const hyderabad = await Mint.create({ name: 'Hyderabad Mint', location: 'Hyderabad', country: india._id, mintMark: 'Five-pointed Star (★)' });
    const noida = await Mint.create({ name: 'Noida Mint', location: 'Noida', country: india._id, mintMark: 'Dot (•)' });

    // Seed Coins
    const coins = [
      {
        name: '1947 King George VI One Rupee',
        slug: '1947-king-george-vi-one-rupee',
        country: britishIndia._id,
        currency: 'INR',
        denomination: '1 Rupee',
        yearOfIssue: 1947,
        mint: mumbai._id,
        mintMark: 'Diamond (◆)',
        material: 'Nickel',
        weight: 11.66,
        diameter: 28,
        thickness: 2.1,
        shape: 'Round',
        obverseDescription: 'Crowned bust of King George VI facing left.',
        reverseDescription: 'Indian Tiger facing left, denomination in English and Urdu.',
        edgeType: 'Security Edge',
        mintage: 25000000,
        condition: 'UNC',
        rarity: 'Rare',
        historicalSignificance: 'Issued during the historic year of Indian Independence.',
        issuingAuthority: 'Government of India / Royal Mint',
        sellingPrice: 4500,
        estimatedMarketValue: 6000,
        images: [
          'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80'
        ],
        category: colonial._id,
        isCommemorativeEdition: false,
        isFeatured: true,
        quantity: 12,
        isAvailable: true,
        era: 'Pre-Independence'
      },
      {
        name: '1835 William IV EIC Rupee',
        slug: '1835-william-iv-eic-rupee',
        country: britishIndia._id,
        currency: 'INR',
        denomination: '1 Rupee',
        yearOfIssue: 1835,
        mint: kolkata._id,
        mintMark: 'RS Initials',
        material: 'Silver (.917)',
        weight: 11.66,
        diameter: 30.5,
        thickness: 1.9,
        shape: 'Round',
        obverseDescription: 'Bust of King William IV facing right.',
        reverseDescription: 'Value in English and Persian within a laurel wreath.',
        edgeType: 'Milled',
        mintage: 15000000,
        condition: 'VF',
        rarity: 'Very Rare',
        historicalSignificance: 'First standardized coinage for British India under East India Company.',
        issuingAuthority: 'East India Company',
        sellingPrice: 12800,
        estimatedMarketValue: 15000,
        images: [
          'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80'
        ],
        category: colonial._id,
        isCommemorativeEdition: false,
        isFeatured: true,
        quantity: 5,
        isAvailable: true,
        era: 'Pre-Independence'
      },
      {
        name: '1918 George V Two Annas',
        slug: '1918-george-v-two-annas',
        country: britishIndia._id,
        currency: 'INR',
        denomination: '2 Annas',
        yearOfIssue: 1918,
        mint: mumbai._id,
        mintMark: 'Dot',
        material: 'Cupro-Nickel',
        weight: 5.83,
        diameter: 21.4,
        thickness: 1.6,
        shape: 'Square with rounded corners',
        obverseDescription: 'Crowned effigy of King George V.',
        reverseDescription: 'Denomination in 4 languages: English, Urdu, Hindi, Bengali.',
        edgeType: 'Plain',
        mintage: 40000000,
        condition: 'XF',
        rarity: 'Scarce',
        historicalSignificance: 'Issued during World War I transition to cupro-nickel.',
        issuingAuthority: 'British Crown',
        sellingPrice: 2150,
        estimatedMarketValue: 2800,
        images: [
          'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
        ],
        category: colonial._id,
        isCommemorativeEdition: false,
        isFeatured: true,
        quantity: 8,
        isAvailable: true,
        era: 'Pre-Independence'
      },
      {
        name: 'Samudragupta Gold Dinar (Gupta Empire)',
        slug: 'samudragupta-gold-dinar-gupta-empire',
        country: princelyStates._id,
        currency: 'Dinar',
        denomination: 'Gold Dinar',
        yearOfIssue: 350,
        mint: kolkata._id,
        mintMark: 'Royal Emblem',
        material: 'Gold',
        weight: 7.6,
        diameter: 20,
        thickness: 2.5,
        shape: 'Round',
        obverseDescription: 'King holding lyre (Veena) seated on couch.',
        reverseDescription: 'Goddess Lakshmi seated on lotus holding cornucopia.',
        edgeType: 'Plain',
        mintage: 5000,
        condition: 'VF',
        rarity: 'Extremely Rare',
        historicalSignificance: 'Golden Age of India - Samudragupta musical type Gold Dinar.',
        issuingAuthority: 'Gupta Empire',
        sellingPrice: 185000,
        estimatedMarketValue: 220000,
        images: [
          'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80'
        ],
        category: royal._id,
        isCommemorativeEdition: true,
        commemorativeInfo: 'Musical Type Specimen',
        isFeatured: true,
        quantity: 1,
        isAvailable: true,
        era: 'Pre-Independence'
      },
      {
        name: '1970 Food For All 10 Rupees Commemorative',
        slug: '1970-food-for-all-10-rupees-commemorative',
        country: india._id,
        currency: 'INR',
        denomination: '10 Rupees',
        yearOfIssue: 1970,
        mint: mumbai._id,
        mintMark: 'Diamond (◆)',
        material: 'Silver (.800)',
        weight: 15.0,
        diameter: 34,
        thickness: 2.2,
        shape: 'Round',
        obverseDescription: 'Ashoka Lion Capital with Satyameva Jayate.',
        reverseDescription: 'Sun rise over wheat stalks with FAO slogan Food For All.',
        edgeType: 'Security Edge',
        mintage: 500000,
        condition: 'UNC',
        rarity: 'Scarce',
        historicalSignificance: 'First non-proof silver commemorative coin of Republic India.',
        issuingAuthority: 'Reserve Bank of India',
        sellingPrice: 3800,
        estimatedMarketValue: 4500,
        images: [
          'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
        ],
        category: republicIndia._id,
        isCommemorativeEdition: true,
        commemorativeInfo: 'FAO World Food Day',
        isFeatured: false,
        quantity: 15,
        isAvailable: true,
        era: 'Post-Independence'
      }
    ];

    await Coin.insertMany(coins);
    console.log('Successfully seeded sample coin catalog!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding catalog failed:', err);
    process.exit(1);
  }
};

seedDatabase();
