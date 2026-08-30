import api from './api';

const paymentService = {
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData).then((res) => res.data),
  demoCheckout: (orderData) => api.post('/payments/demo-checkout', orderData).then((res) => res.data),
  getPaymentHistory: () => api.get('/payments/history').then((res) => res.data),
};

export default paymentService;
