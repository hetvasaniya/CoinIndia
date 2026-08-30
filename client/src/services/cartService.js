import api from './api';

const cartService = {
  getCart: () => api.get('/cart').then((res) => res.data),
  addToCart: (coinId, quantity) => api.post('/cart', { coinId, quantity }).then((res) => res.data),
  updateCartItem: (coinId, quantity) => api.put('/cart', { coinId, quantity }).then((res) => res.data),
  removeFromCart: (coinId) => api.delete(`/cart/${coinId}`).then((res) => res.data),
  clearCart: () => api.delete('/cart').then((res) => res.data),
};

export default cartService;
