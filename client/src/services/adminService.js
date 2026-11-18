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

  // AI-Powered Coin Registration Endpoints
  analyzeSingleCoin: (formData, onUploadProgress) =>
    api.post('/admin/ai-coins/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      timeout: 180000,
    }).then((res) => res.data),

  analyzeBulkCoins: (formData, onUploadProgress) =>
    api.post('/admin/ai-coins/bulk-analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      timeout: 300000,
    }).then((res) => res.data),

  getAnalysisProgress: (analysisId) =>
    api.get(`/admin/ai-coins/progress/${analysisId}`).then((res) => res.data),

  /**
   * Subscribes to real-time analysis progress using Server-Sent Events (SSE)
   * with automatic fallback to polling if SSE is disconnected.
   */
  subscribeToAnalysisProgress: (analysisId, { onProgress, onError, onComplete }) => {
    let isTerminated = false;
    let eventSource = null;
    let pollingInterval = null;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const baseApi = import.meta.env.VITE_API_URL || '/api';
    const sseUrl = `${baseApi}/admin/ai-coins/progress/${analysisId}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    const startPollingFallback = () => {
      if (pollingInterval || isTerminated) return;
      console.log(`[ProgressSubscriber] Using polling fallback for ${analysisId}`);
      pollingInterval = setInterval(async () => {
        if (isTerminated) {
          clearInterval(pollingInterval);
          return;
        }
        try {
          const res = await api.get(`/admin/ai-coins/progress/${analysisId}`);
          const data = res.data;
          if (data) {
            if (onProgress) onProgress(data);
            if (data.status === 'completed') {
              isTerminated = true;
              clearInterval(pollingInterval);
              if (onComplete) onComplete(data);
            } else if (data.status === 'failed') {
              isTerminated = true;
              clearInterval(pollingInterval);
              if (onError) onError(data);
            }
          }
        } catch (pollErr) {
          if (pollErr.response && pollErr.response.status === 404) {
            // Not found yet or expired
          }
        }
      }, 1000);
    };

    try {
      if (typeof window !== 'undefined' && window.EventSource) {
        eventSource = new EventSource(sseUrl, { withCredentials: true });

        eventSource.onmessage = (event) => {
          if (isTerminated) return;
          try {
            const data = JSON.parse(event.data);
            if (onProgress) onProgress(data);

            if (data.status === 'completed') {
              isTerminated = true;
              eventSource.close();
              if (onComplete) onComplete(data);
            } else if (data.status === 'failed') {
              isTerminated = true;
              eventSource.close();
              if (onError) onError(data);
            }
          } catch (e) {
            console.error('[ProgressSubscriber] Error parsing SSE payload:', e);
          }
        };

        eventSource.onerror = (err) => {
          if (isTerminated) return;
          console.warn('[ProgressSubscriber] SSE connection interrupted, falling back to polling.');
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          startPollingFallback();
        };
      } else {
        startPollingFallback();
      }
    } catch (e) {
      startPollingFallback();
    }

    return () => {
      isTerminated = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };
  },

  getCoinDrafts: (params) => api.get('/admin/ai-coins/drafts', { params }).then((res) => res.data),
  getCoinDraft: (id) => api.get(`/admin/ai-coins/drafts/${id}`).then((res) => res.data),
  updateCoinDraft: (id, data) => api.patch(`/admin/ai-coins/drafts/${id}`, data).then((res) => res.data),
  retryCoinDraft: (id, payload) => api.post(`/admin/ai-coins/drafts/${id}/retry`, payload || {}).then((res) => res.data),
  approveCoinDraft: (id, data) => api.post(`/admin/ai-coins/drafts/${id}/approve`, data || {}).then((res) => res.data),
  deleteCoinDraft: (id) => api.delete(`/admin/ai-coins/drafts/${id}`).then((res) => res.data),
};

export default adminService;
