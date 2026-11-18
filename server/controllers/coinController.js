const mongoose = require('mongoose');
const Coin = require('../models/Coin');

const getCoins = async (req, res) => {
  try {
    const { 
      query, search, country, category, categories, mint, mints, yearFrom, yearTo, 
      priceMin, priceMax, era, rarity, material, condition, 
      sort, page = 1, limit = 50 
    } = req.query;

    const filter = {};

    const searchTerm = query || search;
    if (searchTerm && searchTerm.trim() !== '') {
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { historicalSignificance: { $regex: searchTerm, $options: 'i' } },
        { era: { $regex: searchTerm, $options: 'i' } },
        { denomination: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const catParam = categories || category;
    if (catParam && catParam !== '') {
      const catList = catParam.split(',').filter(Boolean);
      if (catList.length > 0) {
        filter.category = { $in: catList };
      }
    }

    const mintParam = mints || mint;
    if (mintParam && mintParam !== '') {
      const mintList = mintParam.split(',').filter(Boolean);
      if (mintList.length > 0) {
        filter.mint = { $in: mintList };
      }
    }

    if (country && country !== '') filter.country = country;
    if (era && era !== '') filter.era = era;
    if (rarity && rarity !== '') filter.rarity = rarity;
    if (material && material !== '') filter.material = material;
    if (condition && condition !== '') filter.condition = condition;

    if (yearFrom || yearTo) {
      filter.yearOfIssue = {};
      if (yearFrom) filter.yearOfIssue.$gte = Number(yearFrom);
      if (yearTo) filter.yearOfIssue.$lte = Number(yearTo);
    }

    if (priceMin || priceMax) {
      filter.sellingPrice = {};
      if (priceMin) filter.sellingPrice.$gte = Number(priceMin);
      if (priceMax) filter.sellingPrice.$lte = Number(priceMax);
    }

    let sortOption = {};
    switch (sort) {
      case 'price_asc': sortOption = { sellingPrice: 1 }; break;
      case 'price_desc': sortOption = { sellingPrice: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      case 'oldest': sortOption = { createdAt: 1 }; break;
      case 'name': sortOption = { name: 1 }; break;
      default: sortOption = { createdAt: -1 }; break;
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const count = await Coin.countDocuments(filter);
    const coins = await Coin.find(filter)
      .populate('category', 'name slug')
      .populate('country', 'name flag')
      .populate('mint', 'name mintMark')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      coins,
      page: Number(page),
      pages: Math.ceil(count / Number(limit)) || 1,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeaturedCoins = async (req, res) => {
  try {
    const coins = await Coin.find({ isFeatured: true })
      .populate('category', 'name slug')
      .populate('country', 'name flag')
      .limit(10);
    res.json(coins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCoinBySlug = async (req, res) => {
  try {
    const coin = await Coin.findOne({ slug: req.params.slug })
      .populate('category', 'name slug description')
      .populate('country', 'name flag')
      .populate('mint', 'name mintMark location');

    if (coin) {
      res.json(coin);
    } else {
      res.status(404).json({ message: 'Coin not found or unavailable' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRelatedCoins = async (req, res) => {
  try {
    const { identifier } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 16);

    // Find the reference coin either by slug or by ObjectId
    let currentCoin = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      currentCoin = await Coin.findById(identifier);
    }
    if (!currentCoin) {
      currentCoin = await Coin.findOne({ slug: identifier });
    }

    if (!currentCoin) {
      return res.status(404).json({ message: 'Coin not found' });
    }

    // Availability filter: must be active/approved (if status exists), available, quantity > 0, and not the current coin
    const baseMatch = {
      _id: { $ne: currentCoin._id },
      isAvailable: true,
      quantity: { $gt: 0 },
      $or: [
        { status: { $in: ['approved', 'active'] } },
        { status: { $exists: false } }
      ]
    };

    const targetCategoryId = currentCoin.category ? (currentCoin.category._id || currentCoin.category) : null;
    const targetCountryId = currentCoin.country ? (currentCoin.country._id || currentCoin.country) : null;
    const targetMintId = currentCoin.mint ? (currentCoin.mint._id || currentCoin.mint) : null;
    const targetDenomination = currentCoin.denomination ? currentCoin.denomination.trim() : null;
    const targetEra = currentCoin.era ? currentCoin.era.trim() : null;

    const scoreExpressions = [];

    if (targetCategoryId && mongoose.Types.ObjectId.isValid(targetCategoryId)) {
      scoreExpressions.push({
        $cond: [{ $eq: ['$category', new mongoose.Types.ObjectId(targetCategoryId.toString())] }, 4, 0]
      });
    }

    if (targetCountryId && mongoose.Types.ObjectId.isValid(targetCountryId)) {
      scoreExpressions.push({
        $cond: [{ $eq: ['$country', new mongoose.Types.ObjectId(targetCountryId.toString())] }, 3, 0]
      });
    }

    if (targetDenomination) {
      scoreExpressions.push({
        $cond: [{ $eq: ['$denomination', targetDenomination] }, 3, 0]
      });
    }

    if (targetMintId && mongoose.Types.ObjectId.isValid(targetMintId)) {
      scoreExpressions.push({
        $cond: [{ $eq: ['$mint', new mongoose.Types.ObjectId(targetMintId.toString())] }, 2, 0]
      });
    }

    if (targetEra) {
      scoreExpressions.push({
        $cond: [{ $eq: ['$era', targetEra] }, 1, 0]
      });
    }

    let pipeline = [{ $match: baseMatch }];

    if (scoreExpressions.length > 0) {
      pipeline.push({
        $addFields: {
          similarityScore: { $add: scoreExpressions }
        }
      });
      pipeline.push({
        $sort: {
          similarityScore: -1,
          isFeatured: -1,
          createdAt: -1
        }
      });
    } else {
      pipeline.push({
        $sort: {
          isFeatured: -1,
          createdAt: -1
        }
      });
    }

    pipeline.push({ $limit: limit });

    let coins = await Coin.aggregate(pipeline);

    // Populate references
    coins = await Coin.populate(coins, [
      { path: 'category', select: 'name slug description' },
      { path: 'country', select: 'name flag code' },
      { path: 'mint', select: 'name mintMark location' }
    ]);

    res.json(coins);
  } catch (error) {
    console.error('Error fetching related coins:', error);
    // Graceful fallback to simple find query if aggregation fails
    try {
      const { identifier } = req.params;
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 16);
      let fallbackCurrent = null;
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        fallbackCurrent = await Coin.findById(identifier);
      }
      if (!fallbackCurrent) {
        fallbackCurrent = await Coin.findOne({ slug: identifier });
      }

      const fallbackQuery = {
        isAvailable: true,
        quantity: { $gt: 0 }
      };
      if (fallbackCurrent) {
        fallbackQuery._id = { $ne: fallbackCurrent._id };
      }

      const fallbackCoins = await Coin.find(fallbackQuery)
        .populate('category', 'name slug description')
        .populate('country', 'name flag code')
        .populate('mint', 'name mintMark location')
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(limit);

      return res.json(fallbackCoins);
    } catch (fallbackError) {
      res.status(500).json({ message: error.message });
    }
  }
};

const createCoin = async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => file.path) : [];
    const coinData = { ...req.body, images };
    
    const coin = new Coin(coinData);
    const createdCoin = await coin.save();
    res.status(201).json(createdCoin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCoin = async (req, res) => {
  try {
    const coin = await Coin.findById(req.params.id);
    if (coin) {
      Object.assign(coin, req.body);
      
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => file.path);
        coin.images = [...coin.images, ...newImages];
      }

      const updatedCoin = await coin.save();
      res.json(updatedCoin);
    } else {
      res.status(404).json({ message: 'Coin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCoin = async (req, res) => {
  try {
    const coin = await Coin.findById(req.params.id);
    if (coin) {
      await coin.deleteOne();
      res.json({ message: 'Coin removed' });
    } else {
      res.status(404).json({ message: 'Coin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const rawQty = req.body.quantity;
    const qty = parseInt(rawQty, 10);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'A valid non-negative quantity is required' });
    }
    const coin = await Coin.findById(req.params.id);
    if (coin) {
      coin.quantity = qty;
      coin.isAvailable = qty > 0;
      const updatedCoin = await coin.save();
      res.json(updatedCoin);
    } else {
      res.status(404).json({ message: 'Coin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleFeatured = async (req, res) => {
  try {
    const coin = await Coin.findById(req.params.id);
    if (coin) {
      coin.isFeatured = !coin.isFeatured;
      const updatedCoin = await coin.save();
      res.json(updatedCoin);
    } else {
      res.status(404).json({ message: 'Coin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCoinById = async (req, res) => {
  try {
    const coin = await Coin.findById(req.params.id)
      .populate('category', 'name _id')
      .populate('country', 'name _id')
      .populate('mint', 'name _id');
    if (coin) {
      res.json(coin);
    } else {
      res.status(404).json({ message: 'Coin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminCoins = async (req, res) => {
  try {
    const coins = await Coin.find({})
      .populate('category', 'name')
      .populate('country', 'name')
      .sort({ createdAt: -1 });
    res.json(coins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCoins,
  getFeaturedCoins,
  getCoinBySlug,
  getRelatedCoins,
  getCoinById,
  createCoin,
  updateCoin,
  deleteCoin,
  updateQuantity,
  toggleFeatured,
  getAdminCoins
};
