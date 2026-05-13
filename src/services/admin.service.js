import api from './api.js';
export const stats = (period) => api.get('/admin/stats', { params: { period } }).then(r => r.data);
export const topProducts = (period) => api.get('/admin/top-products', { params: { period } }).then(r => r.data);
export const weekChart = () => api.get('/admin/week-chart').then(r => r.data);
export const listCustomers = () => api.get('/customers').then(r => r.data);
export const exportCustomers = async () => {
  const res = await api.get('/customers/export', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clienti.csv';
  a.click();
  URL.revokeObjectURL(url);
};
