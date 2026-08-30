const Wishlist = require('../models/Wishlist');

const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('coins', 'name sellingPrice images slug isAvailable isFeatured');
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, coins: [] });
    }
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { coinId } = req.params;
    
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, coins: [] });
    }

    const coinIndex = wishlist.coins.indexOf(coinId);
    
    if (coinIndex > -1) {
      wishlist.coins.splice(coinIndex, 1);
    } else {
      wishlist.coins.push(coinId);
    }

    await wishlist.save();
    
    wishlist = await Wishlist.findOne({ user: req.user._id }).populate('coins', 'name sellingPrice images slug isAvailable isFeatured');
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { coinId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });

    wishlist.coins = wishlist.coins.filter((id) => id.toString() !== coinId);
    
    await wishlist.save();
    const updatedWishlist = await Wishlist.findOne({ user: req.user._id }).populate('coins', 'name sellingPrice images slug isAvailable isFeatured');
    res.json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWishlist, toggleWishlist, removeFromWishlist };
