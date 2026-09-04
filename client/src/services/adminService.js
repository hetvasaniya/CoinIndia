import api from './api';

const adminService = {
  getDashboard: () => api.get('/admin/dashboard').then((res) => res.data),
  getCoins: (params) => api.get('/admin/coins', { params }).then((res) => res.data),
  getCoin: (id) => api.get(`/admin/coins/${id}`).then((res) => res.data),
  createCoin: (data) => api.post('/admin/coins', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data),
  updateCoin: (id, data) => api.put(`/admin/coins/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data),
  deleteCoin: (id) => api.delete(`/admin/coins/${id}`).then((res) => res.data),
  updateQuantity: (id, quantity) => api.put(`/admin/coins/${id}/quantity`, { quantity }).then((res) => res.data),
  toggleFeatured: (id) => api.put(`/admin/coins/${id}/featured`).then((res) => res.data),
  
  getCategories: () => api.get('/admin/categories').then((res) => res.data),
  createCategory: (data) => api.post('/admin/categories', data).then((res) => res.data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data).then((res) => res.data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`).then((res) => res.data),
  
  getCountries: () => api.get('/admin/countries').then((res) => res.data),
  createCountry: (data) => api.post('/admin/countries', data).then((res) => res.data),
  updateCountry: (id, data) => api.put(`/admin/countries/${id}`, data).then((res) => res.data),
  deleteCountry: (id) => api.delete(`/admin/countries/${id}`).then((res) => res.data),
  
  getMints: () => api.get('/admin/mints').then((res) => res.data),
  createMint: (data) => api.post('/admin/mints', data).then((res) => res.data),
  updateMint: (id, data) => api.put(`/admin/mints/${id}`, data).then((res) => res.data),
  deleteMint: (id) => api.delete(`/admin/mints/${id}`).then((res) => res.data),
  
  getOrders: (params) => api.get('/admin/orders', { params }).then((res) => res.data),
  getOrder: (id) => api.get(`/admin/orders/${id}`).then((res) => res.data),
  getOrderStats: () => api.get('/admin/orders/stats').then((res) => res.data),
  updateOrderStatus: (id, payload) => 
    api.put(`/admin/orders/${id}/status`, typeof payload === 'string' ? { status: payload } : payload).then((res) => res.data),
  cancelOrder: (id, data) => api.put(`/admin/orders/${id}/cancel`, data).then((res) => res.data),
  processRefund: (id, data) => api.put(`/admin/orders/${id}/refund`, data).then((res) => res.data),
  getRefunds: (params) => api.get('/admin/refunds', { params }).then((res) => res.data),
  getRefundStats: () => api.get('/admin/refunds/stats').then((res) => res.data),
  
  getUsers: (params) => api.get('/admin/users', { params }).then((res) => res.data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data).then((res) => res.data),
  
  getInventory: (params) => api.get('/admin/inventory', { params }).then((res) => res.data),
  getPaymentHistory: (params) => api.get('/admin/payments', { params }).then((res) => res.data),
};

export default adminService;
