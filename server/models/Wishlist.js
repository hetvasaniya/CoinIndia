const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coin',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
