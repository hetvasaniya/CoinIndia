const Cart = require('../models/Cart');
const Coin = require('../models/Coin');

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.coin', 'name sellingPrice images slug isAvailable quantity');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { coinId, quantity } = req.body;

    const coin = await Coin.findById(coinId);
    if (!coin || !coin.isAvailable || coin.quantity < quantity) {
      return res.status(400).json({ message: 'Coin unavailable or insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) => item.coin.toString() === coinId);

    if (itemIndex > -1) {
      if (cart.items[itemIndex].quantity + quantity > coin.quantity) {
        return res.status(400).json({ message: 'Insufficient stock for requested quantity' });
      }
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ coin: coinId, quantity });
    }

    await cart.save();
    
    cart = await Cart.findOne({ user: req.user._id }).populate('items.coin', 'name sellingPrice images slug isAvailable quantity');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { coinId, quantity } = req.body;

    const coin = await Coin.findById(coinId);
    if (!coin || !coin.isAvailable || coin.quantity < quantity) {
      return res.status(400).json({ message: 'Coin unavailable or insufficient stock' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemIndex = cart.items.findIndex((item) => item.coin.toString() === coinId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.coin', 'name sellingPrice images slug isAvailable quantity');
      res.json(updatedCart);
    } else {
      res.status(404).json({ message: 'Item not in cart' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter((item) => item.coin.toString() !== itemId);
    
    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.coin', 'name sellingPrice images slug isAvailable quantity');
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
