import axios from 'axios';

// Dynamic API URL based on current hostname
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // If using ngrok (HTTPS), use the LocalTunnel backend URL
  if (hostname.includes('ngrok-free.app') || hostname.includes('ngrok.io')) {
    // Use the LocalTunnel backend tunnel URL
    return 'https://chitchat-backend-2025.loca.lt/api';
  }
  
  // For local development
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }
  
  // Fallback
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

// Dynamic Socket.io URL based on current hostname
export const getSocketUrl = () => {
  const hostname = window.location.hostname;
  
  // If using ngrok (HTTPS), use the LocalTunnel backend URL
  if (hostname.includes('ngrok-free.app') || hostname.includes('ngrok.io')) {
    // Use the LocalTunnel backend tunnel URL
    return 'https://chitchat-backend-2025.loca.lt';
  }
  
  // For local development
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
  }
  
  // Fallback
  return process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Enhanced error logging
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('API Network Error:', {
        message: 'No response received from server',
        url: error.config?.url,
        method: error.config?.method
      });
      
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. The server is taking too long to respond.';
      }
    } else {
      console.error('API Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  login: (credentials: any) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  deleteAccount: () => api.delete('/auth/account'),
};

// Users API
export const usersAPI = {
  getRandomUsers: () => api.get('/users/random'),
  searchUsers: (query: string) => api.get(`/users/search?q=${query}`),
  getUserProfile: (userId: string) => api.get(`/users/${userId}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  updateAvatar: (avatar: string) => api.put('/users/avatar', { avatar }),
};

// Friends API
export const friendsAPI = {
  sendFriendRequest: (userId: string) => api.post('/friends/request', { userId }),
  getFriendRequests: () => api.get('/friends/requests'),
  respondToFriendRequest: (requestId: string, action: 'accept' | 'reject') => 
    api.put(`/friends/request/${requestId}`, { action }),
  getFriends: () => api.get('/friends'),
  removeFriend: (friendId: string) => api.delete(`/friends/${friendId}`),
};

// Chat API
export const chatAPI = {
  getChatHistory: (userId: string) => api.get(`/chat/${userId}`),
  sendMessage: (data: any) => api.post('/chat/send', data),
  markMessageAsRead: (messageId: string) => api.put(`/chat/message/${messageId}/read`),
  getConversations: () => api.get('/chat/conversations'),
};

export default api;
