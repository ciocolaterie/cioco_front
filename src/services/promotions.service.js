import api from './api.js';

export const listPromotions = () => api.get('/promotions').then(r => r.data);
export const createPromotion = (data) => api.post('/promotions', data).then(r => r.data);
export const updatePromotion = (id, data) => api.put(`/promotions/${id}`, data).then(r => r.data);
export const deletePromotion = (id) => api.delete(`/promotions/${id}`).then(r => r.data);
export const applyPromotion = (code, subtotal) =>
  api.post('/promotions/apply', { code, subtotal }).then(r => r.data);
