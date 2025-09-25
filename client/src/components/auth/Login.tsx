import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check backend connectivity on component mount
  useEffect(() => {
    let isMounted = true;
    
    const checkBackendStatus = async () => {
      try {
        if (!isMounted) return;
        setBackendStatus('checking');
        
        // Use a simple health check endpoint instead of getMe
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await authAPI.health();
        
        clearTimeout(timeoutId);
        
        if (!isMounted) return;
        
        if (response.status === 200) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        console.log('Backend connectivity check failed:', error);
        if (error.name === 'AbortError' || (error.name === 'TypeError' && error.message.includes('fetch'))) {
          // Network error or timeout - backend is likely down
          setBackendStatus('offline');
        } else {
          // Other error - assume backend is online
          setBackendStatus('online');
        }
      }
    };

    checkBackendStatus();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login: Attempting login with email:', formData.email);
      
      // Use AuthContext login but handle errors locally
      await login(formData.email, formData.password);
      
      console.log('Login: Login successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login: Login error:', err);
      console.error('Login: Error response:', err.response);
      console.error('Login: Error request:', err.request);
      console.error('Login: Error message:', err.message);
      console.error('Login: Error type:', typeof err);
      console.error('Login: Error keys:', Object.keys(err));
      
      let errorMessage = 'Login failed';
      
      if (err.response) {
        console.log('Login: Has response, status:', err.response.status);
        console.log('Login: Response data:', err.response.data);
        // Server responded with error status
        if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Invalid email or password';
        } else if (err.response.status === 401) {
          errorMessage = 'Invalid credentials';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = err.response.data?.message || `Server error (${err.response.status})`;
        }
      } else if (err.request) {
        console.log('Login: Has request, no response');
        // Network error - no response received
        if (err.code === 'ECONNABORTED') {
          errorMessage = '⏱️ Request timeout. The server is taking too long to respond. Please check if the backend server is running.';
        } else {
          errorMessage = '🔌 Cannot connect to server. Please check your network connection and ensure the backend server is running.';
        }
        // Update backend status to offline
        setBackendStatus('offline');
      } else {
        console.log('Login: Other error type');
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      console.log('Login: Final error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" color="primary" fontWeight="bold">
              Chit Chat
            </Typography>
            <Typography variant="h5" component="h2" sx={{ mt: 1 }}>
              Welcome Back!
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Backend Status Alert */}
          {backendStatus === 'checking' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              🔍 Checking backend connectivity...
            </Alert>
          )}
          
          {backendStatus === 'offline' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ Backend server is not reachable. Please ensure the server is running on port 5000.
            </Alert>
          )}
          
          {backendStatus === 'online' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Backend server is online and ready.
            </Alert>
          )}

          {/* Retry Backend Check Button */}
          {backendStatus === 'offline' && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                color="warning"
                onClick={async () => {
                  try {
                    setBackendStatus('checking');
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/health`, {
                      method: 'GET',
                      signal: controller.signal,
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                      setBackendStatus('online');
                    } else {
                      setBackendStatus('offline');
                    }
                  } catch (error: any) {
                    console.log('Retry backend check failed:', error);
                    if (error.name === 'AbortError' || (error.name === 'TypeError' && error.message.includes('fetch'))) {
                      setBackendStatus('offline');
                    } else {
                      setBackendStatus('online');
                    }
                  }
                }}
                sx={{ mb: 1 }}
              >
                🔄 Retry Backend Connection
              </Button>
            </Box>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || backendStatus === 'offline'}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
