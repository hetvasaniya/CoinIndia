import { CONDITION_COLORS, STATUS_COLORS, REFUND_STATUS_COLORS, PAYMENT_STATUS_COLORS } from './constants';

export const formatPrice = (price) => {
  const numPrice = Number(price);
  const validPrice = isNaN(numPrice) ? 0 : numPrice;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(validPrice);
};

export const getImageUrl = (images, fallback = 'https://placehold.co/300x300?text=No+Image') => {
  if (!images || !Array.isArray(images) || images.length === 0) return fallback;
  const img = images[0];
  if (typeof img === 'string') return img;
  if (typeof img === 'object' && img?.url) return img.url;
  return fallback;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getConditionColor = (condition) => {
  return CONDITION_COLORS[condition] || 'bg-gray-100 text-gray-800';
};

export const getStatusColor = (status) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  return STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
};

export const getRefundStatusColor = (status) => {
  if (!status) return 'bg-gray-100 text-gray-700';
  return REFUND_STATUS_COLORS[status.toLowerCase()] || 'bg-gray-100 text-gray-700';
};

export const getPaymentStatusColor = (status) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  return PAYMENT_STATUS_COLORS[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

