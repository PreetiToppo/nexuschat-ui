import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
};

export const chatAPI = {
  getMessages: (channelId, limit = 50) =>
    api.get(`/api/channels/${channelId}/messages?limit=${limit}`),
  getPresence: (channelId) =>
    api.get(`/api/channels/${channelId}/presence`),
};

export default api;