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
    const coin = await Coin.findById(req.params.id);
    if (coin) {
      coin.quantity = req.body.quantity;
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
  getCoinById,
  createCoin,
  updateCoin,
  deleteCoin,
  updateQuantity,
  toggleFeatured,
  getAdminCoins
};
