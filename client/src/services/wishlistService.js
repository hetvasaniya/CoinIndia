import api from './api';

const wishlistService = {
  getWishlist: () => api.get('/wishlist').then((res) => res.data),
  toggleWishlist: (coinId) => api.post(`/wishlist/${coinId}`).then((res) => res.data),
  removeFromWishlist: (coinId) => api.delete(`/wishlist/${coinId}`).then((res) => res.data),
};

export default wishlistService;
