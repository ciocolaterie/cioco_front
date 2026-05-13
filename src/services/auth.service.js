import api from './api.js';
export const login = (email, password) => api.post('/auth/login', { email, password }).then(r => r.data);
export const register = (data) => api.post('/auth/register', data).then(r => r.data);
export const logout = () => api.post('/auth/logout').then(r => r.data);
export const me = () => api.get('/auth/me').then(r => r.data);
export const updateProfile = (data) => api.patch('/auth/profile', data).then(r => r.data);
export const changePassword = (data) => api.patch('/auth/change-password', data).then(r => r.data);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then(r => r.data);
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password }).then(r => r.data);
