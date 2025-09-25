import axios from 'axios';

// Dynamic API URL based on current hostname
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  console.log('🔍 API Service Debug:', {
    hostname,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    isDevTunnels: hostname.includes('devtunnels.ms'),
    isNgrok: hostname.includes('ngrok-free.app') || hostname.includes('ngrok.io'),
    isCloudflare: hostname.includes('trycloudflare.com')
  });
  
  // Always use environment variable for API URL
  const url = process.env.REACT_APP_API_URL;
  
  // Log the detected environment for debugging
  if (hostname.includes('devtunnels.ms')) {
    console.log('🌐 Detected Dev Tunnels environment, using API URL:', url);
  } else if (hostname.includes('ngrok-free.app') || hostname.includes('ngrok.io')) {
    console.log('🌐 Detected ngrok environment, using API URL:', url);
  } else if (hostname.includes('trycloudflare.com')) {
    console.log('🌐 Detected Cloudflare tunnel environment, using API URL:', url);
  } else {
    console.log('🌐 Detected local development environment, using API URL:', url);
  }
  
  return url;
};

// Dynamic Socket.io URL based on current hostname
export const getSocketUrl = () => {
  const hostname = window.location.hostname;
  
  // Always use environment variable for socket URL
  const url = process.env.REACT_APP_SOCKET_URL;
  
  // Log the detected environment for debugging
  if (hostname.includes('devtunnels.ms')) {
    console.log('🌐 Detected Dev Tunnels environment, using Socket URL:', url);
  } else if (hostname.includes('ngrok-free.app') || hostname.includes('ngrok.io')) {
    console.log('🌐 Detected ngrok environment, using Socket URL:', url);
  } else if (hostname.includes('trycloudflare.com')) {
    console.log('🌐 Detected Cloudflare tunnel environment, using Socket URL:', url);
  } else {
    console.log('🌐 Detected local development environment, using Socket URL:', url);
  }
  
  return url;
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
  register: (userData: any) => api.post('/api/auth/register', userData),
  login: (credentials: any) => api.post('/api/auth/login', credentials),
  getMe: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
  deleteAccount: () => api.delete('/api/auth/account'),
  health: () => api.get('/api/health'),
};

// Users API
export const usersAPI = {
  getRandomUsers: () => api.get('/api/users/random'),
  searchUsers: (query: string) => api.get(`/api/users/search?q=${query}`),
  getUserProfile: (userId: string) => api.get(`/api/users/${userId}`),
  updateProfile: (data: any) => api.put('/api/users/profile', data),
  updateAvatar: (avatar: string) => api.put('/api/users/avatar', { avatar }),
};

// Friends API
export const friendsAPI = {
  sendFriendRequest: (userId: string) => api.post('/api/friends/request', { userId }),
  getFriendRequests: () => api.get('/api/friends/requests'),
  respondToFriendRequest: (requestId: string, action: 'accept' | 'reject') => 
    api.put(`/api/friends/request/${requestId}`, { action }),
  getFriends: () => api.get('/api/friends'),
  removeFriend: (friendId: string) => api.delete(`/api/friends/${friendId}`),
};

// Chat API
export const chatAPI = {
  getChatHistory: (userId: string) => api.get(`/api/chat/${userId}`),
  sendMessage: (data: any) => api.post('/api/chat/send', data),
  markMessageAsRead: (messageId: string) => api.put(`/api/chat/message/${messageId}/read`),
  getConversations: () => api.get('/api/chat/conversations'),
};

export default api;
