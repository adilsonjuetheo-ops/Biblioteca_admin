import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bibliotecaapi-production-7ee0.up.railway.app',
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;