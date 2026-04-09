import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://biblioteca-api.railway.app',
  timeout: 10000,
});

export default api;