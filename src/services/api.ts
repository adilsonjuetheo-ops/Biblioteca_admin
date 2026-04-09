import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bibliotecaapi-production-7ee0.up.railway.app',
  timeout: 10000,
});

export default api;