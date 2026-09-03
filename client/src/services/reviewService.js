import api from './api';

export const reviewService = {
  // Fetch reviews with stats and filters
  getReviews: async (params = {}) => {
    const response = await api.get('/reviews', { params });
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Submit a customer review
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Upvote helpful review
  markHelpful: async (id) => {
    const response = await api.post(`/reviews/${id}/helpful`);
    return response.data;
  }
};

export default reviewService;
