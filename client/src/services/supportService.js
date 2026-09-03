import api from './api';

export const supportService = {
  // Submit support inquiry from client side
  submitInquiry: async (inquiryData) => {
    const response = await api.post('/support', inquiryData);
    return response.data;
  },

  // Get all support inquiries for admin with optional status filter
  getAdminInquiries: async (status = '', search = '') => {
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await api.get('/support/admin', { params });
    return response.data?.data || response.data;
  },

  // Update inquiry status or admin reply
  updateInquiry: async (id, updateData) => {
    const response = await api.put(`/support/admin/${id}`, updateData);
    return response.data;
  },

  // Delete support inquiry
  deleteInquiry: async (id) => {
    const response = await api.delete(`/support/admin/${id}`);
    return response.data;
  }
};

export default supportService;
