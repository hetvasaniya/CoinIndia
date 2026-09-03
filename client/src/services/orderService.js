import api from './api';

const orderService = {
  createOrder: (orderData) => api.post('/orders', orderData).then((res) => res.data),
  getOrders: () => api.get('/orders').then((res) => res.data),
  getMyOrders: () => api.get('/orders').then((res) => res.data),
  getOrderById: (id) => api.get(`/orders/${id}`).then((res) => res.data),
  getOrder: (id) => api.get(`/orders/${id}`).then((res) => res.data),
};

export default orderService;
