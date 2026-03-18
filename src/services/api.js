import axios from 'axios';
import useStore from '../store/useStore';

const api = axios.create({
  baseURL: 'https://nexuschat-server-production.up.railway.app',
});

// Read token from Zustand memory, not localStorage
api.interceptors.request.use((config) => {
  const token = useStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh when token expires
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            'http://localhost:8080/api/auth/refresh',
            { refreshToken }
          );
          useStore.getState().setAuth(
            JSON.parse(localStorage.getItem('user')),
            data.accessToken,
            refreshToken
          );
          err.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(err.config);
        } catch (refreshError) {
          // Refresh token expired — force logout
          useStore.getState().logout();
          window.location.reload();
        }
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
};

export const chatAPI = {
  getMessages: (channelId, limit = 50) =>
    api.get(`/api/channels/${channelId}/messages?limit=${limit}`),
  getPresence: (channelId) =>
    api.get(`/api/channels/${channelId}/presence`),
  getAllOnlineUsers: () =>
    api.get('/api/presence/online'),                    // ← new
};

export default api;