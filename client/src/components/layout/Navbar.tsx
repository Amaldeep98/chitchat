import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Home,
  Explore,
  People,
  Chat,
  Person,
  Logout,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI } from '../../services/api';
import { getSocketUrl } from '../../services/api';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUnreadCount = async () => {
      try {
        console.log('Fetching unread count...');
        const response = await chatAPI.getConversations();
        
        if (isMounted) {
          const totalUnread = response.data.conversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);
          console.log('Setting unread count to:', totalUnread);
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    if (user) {
      // Initialize socket connection
      const newSocket = io(getSocketUrl());
      newSocket.emit('join_room', user._id);
      
      // Listen for messages being read
      newSocket.on('messages_read', (data: any) => {
        console.log('Navbar received messages_read:', data);
        if (isMounted) {
          // Decrease unread count by the number of messages read
          // This event is received when the current user reads messages
          setUnreadCount(prev => Math.max(0, prev - data.messageIds.length));
        }
      });
      
      // Listen for new messages (increase unread count)
      newSocket.on('receive_message', (data: any) => {
        console.log('New message received:', data);
        if (isMounted) {
          // Only increase unread count if user is not currently viewing this chat
          // We'll check if the current route is not the chat with this sender
          const currentPath = window.location.pathname;
          const isViewingThisChat = currentPath.includes(`/chat/${data.senderId}`);
          
          if (!isViewingThisChat) {
            setUnreadCount(prev => prev + 1);
          }
        }
      });
      
      setSocket(newSocket);
      
      fetchUnreadCount();
      // Refresh unread count every 30 seconds
      const interval = setInterval(() => {
        if (isMounted) {
          fetchUnreadCount();
        }
      }, 30000);
      
      return () => {
        isMounted = false;
        clearInterval(interval);
        newSocket.disconnect();
      };
    }
  }, [user]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', icon: <Home />, path: '/dashboard' },
    { label: 'Discover', icon: <Explore />, path: '/discover' },
    { label: 'Friends', icon: <People />, path: '/friends' },
  ];

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 0, mr: 4, fontWeight: 'bold' }}
        >
          Chit Chat
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Chat />
            </Badge>
          </IconButton>

          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{ p: 0 }}
          >
            <Avatar
              src={user?.avatar}
              alt={user?.firstName}
              sx={{ width: 32, height: 32 }}
            >
              {user?.firstName?.[0]}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
              <Person sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
