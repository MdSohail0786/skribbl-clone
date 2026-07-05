import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

export const roomApi = {
  create: (payload) => api.post('/rooms', payload),
  checkJoin: (payload) => api.post('/rooms/join', payload),
  list: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
};

export const healthApi = {
  check: () => api.get('/health'),
};

export default api;
