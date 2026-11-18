import api from './api';

const authService = {
  register: (userData) => api.post('/auth/register', userData).then((res) => res.data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data).then((res) => res.data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }).then((res) => res.data),
  login: (credentials) => api.post('/auth/login', credentials).then((res) => res.data),
  logout: () => api.post('/auth/logout').then((res) => res.data),
  getMe: () => api.get('/auth/me').then((res) => res.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((res) => res.data),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }).then((res) => res.data),
  updateProfile: (data) => api.put('/auth/update-profile', data).then((res) => res.data),
  changePassword: (data) => api.put('/auth/change-password', data).then((res) => res.data),
};

export default authService;
