import api from './api';

export const settingsService = {
  // Get public settings (client side)
  getPublicSettings: async () => {
    const response = await api.get('/settings/public');
    return response.data?.data || response.data;
  },

  // Get full admin settings
  getAdminSettings: async () => {
    const response = await api.get('/settings/admin');
    return response.data?.data || response.data;
  },

  // Update admin settings
  updateSettings: async (settingsData) => {
    const response = await api.put('/settings/admin', settingsData);
    return response.data;
  },

  // Upload Privacy Policy PDF
  uploadPrivacyPolicy: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/settings/admin/privacy-policy', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete Privacy Policy PDF
  deletePrivacyPolicy: async () => {
    const response = await api.delete('/settings/admin/privacy-policy');
    return response.data;
  }
};

export default settingsService;
