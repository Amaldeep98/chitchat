import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Button,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  PersonAdd,
  Chat,
  Explore,
  People,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, chatAPI, friendsAPI, getSocketUrl } from '../services/api';
import io from 'socket.io-client';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatar: string;
  age?: number;
  location: string;
  interests: string[];
  isOnline: boolean;
  lastSeen: string;
}

interface Conversation {
  user: User;
  lastMessage: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [randomUsers, setRandomUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Initialize socket connection
    const newSocket = io(getSocketUrl());
    newSocket.emit('join_room', user?._id);
    
    // Listen for conversation updates
    newSocket.on('conversation_updated', (data: any) => {
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv.user._id === data.userId);
        
        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: data.lastMessage
          };
          return updated.sort((a, b) => 
            new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
          );
        } else {
          // Add new conversation (this shouldn't happen often)
          fetchDashboardData();
        }
        return prev;
      });
    });
    
    // Listen for online status updates
    newSocket.on('user_online', (data: any) => {
      setConversations(prev => prev.map(conv => 
        conv.user._id === data.userId 
          ? { ...conv, user: { ...conv.user, isOnline: true } }
          : conv
      ));
    });
    
    newSocket.on('user_offline', (data: any) => {
      setConversations(prev => prev.map(conv => 
        conv.user._id === data.userId 
          ? { ...conv, user: { ...conv.user, isOnline: false } }
          : conv
      ));
    });
    
    // Listen for messages being read
    newSocket.on('messages_read', (data: any) => {
      console.log('Dashboard received messages_read:', data);
      setConversations(prev => prev.map(conv => 
        conv.user._id === data.senderId 
          ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - data.messageIds.length) }
          : conv
      ));
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  const fetchDashboardData = async () => {
    try {
      const [randomUsersRes, conversationsRes] = await Promise.all([
        usersAPI.getRandomUsers(),
        chatAPI.getConversations(),
      ]);
      
      setRandomUsers(randomUsersRes.data.users.slice(0, 3));
      setConversations(conversationsRes.data.conversations.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await friendsAPI.sendFriendRequest(userId);
      // Remove user from random users list
      setRandomUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleStartChat = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.firstName}! 👋
      </Typography>
      
      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Explore />}
                  onClick={() => navigate('/discover')}
                  fullWidth
                >
                  Discover People
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<People />}
                  onClick={() => navigate('/friends')}
                  fullWidth
                >
                  View Friends
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Conversations */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Chats
              </Typography>
              {conversations.length > 0 ? (
                <List>
                  {conversations.map((conv, index) => (
                    <React.Fragment key={conv.user._id}>
                      <ListItem
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleStartChat(conv.user._id)}
                      >
                        <ListItemAvatar>
                          <Avatar src={conv.user.avatar}>
                            {conv.user.firstName[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box component="span">
                                {conv.user.firstName + ' ' + conv.user.lastName}
                              </Box>
                              {conv.user.isOnline && (
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: 'green',
                                    display: 'inline-block'
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box component="span">
                              <Box component="span" sx={{ display: 'block' }}>
                                {conv.lastMessage.content}
                              </Box>
                              {conv.unreadCount > 0 && (
                                <Box component="span" sx={{ display: 'inline-block', mt: 0.5 }}>
                                  <Chip
                                    label={conv.unreadCount}
                                    size="small"
                                    color="primary"
                                  />
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < conversations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent conversations
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Suggested People */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Suggested People
              </Typography>
              {randomUsers.length > 0 ? (
                <List>
                  {randomUsers.map((suggestedUser, index) => (
                    <React.Fragment key={suggestedUser._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={suggestedUser.avatar}>
                            {suggestedUser.firstName[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={suggestedUser.firstName + ' ' + suggestedUser.lastName}
                          secondary={
                            <Box component="span">
                              <Box component="span" sx={{ display: 'block' }}>
                                @{suggestedUser.username}
                              </Box>
                              {suggestedUser.location && (
                                <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary' }}>
                                  📍 {suggestedUser.location}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleSendFriendRequest(suggestedUser._id)}
                          >
                            <PersonAdd />
                          </IconButton>
                        </Box>
                      </ListItem>
                      {index < randomUsers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No suggestions available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
