import api from './api';

const coinService = {
  getCoins: (params) => api.get('/coins', { params }).then((res) => res.data),
  getFeaturedCoins: () => api.get('/coins/featured').then((res) => res.data),
  getCoinBySlug: (slug) => api.get(`/coins/${slug}`).then((res) => res.data),
  getCategories: () => api.get('/categories').then((res) => res.data),
  getCountries: () => api.get('/countries').then((res) => res.data),
  getMints: () => api.get('/mints').then((res) => res.data),
};

export default coinService;
