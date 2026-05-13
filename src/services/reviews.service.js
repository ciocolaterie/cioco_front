import api from './api.js';

export const getProductReviews = (productId) =>
  api.get(`/products/${productId}/reviews`).then(r => r.data);

export const submitReview = (productId, data) =>
  api.post(`/products/${productId}/reviews`, data).then(r => r.data);

export const listReviews = (status) =>
  api.get('/admin/reviews', { params: { status } }).then(r => r.data);

export const moderateReview = (id, status) =>
  api.patch(`/admin/reviews/${id}`, { status }).then(r => r.data);

export const deleteReview = (id) =>
  api.delete(`/admin/reviews/${id}`).then(r => r.data);

export const getFeaturedReviews = () =>
  api.get('/settings/featured-reviews').then(r => r.data);

export const updateFeaturedReviews = (data) =>
  api.put('/admin/featured-reviews', data).then(r => r.data);
