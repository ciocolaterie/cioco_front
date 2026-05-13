import api from './api.js';
export const listOrders = (params) => api.get('/orders', { params }).then(r => r.data);
export const myOrders = () => api.get('/orders/me').then(r => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then(r => r.data);
export const createOrder = (data) => api.post('/orders', data).then(r => r.data);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status }).then(r => r.data);
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`).then(r => r.data);
