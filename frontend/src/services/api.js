import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000' });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const login           = (u, p) => API.post('/api/auth/login', new URLSearchParams({ username: u, password: p }));
export const getStats        = ()      => API.get('/api/dashboard/stats');
export const getPackets      = (n=100) => API.get(`/api/dashboard/packets?limit=${n}`);
export const getAlerts       = (n=100, sev='') => API.get(`/api/dashboard/alerts?limit=${n}${sev ? `&severity=${sev}` : ''}`);
export const getInterfaces   = ()      => API.get('/api/dashboard/interfaces');
export const setInterface    = (iface) => API.post(`/api/dashboard/interfaces/${iface}`);

export default API;
