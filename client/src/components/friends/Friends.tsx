import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Chat,
  PersonAdd,
  Check,
  Close,
  Delete,
} from '@mui/icons-material';
import { friendsAPI } from '../../services/api';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  bio: string;
  isOnline: boolean;
  lastSeen: string;
}

interface FriendRequest {
  _id: string;
  from: User;
  status: string;
  createdAt: string;
}

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const fetchFriendsData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendsAPI.getFriends(),
        friendsAPI.getFriendRequests(),
      ]);
      
      setFriends(friendsRes.data.friends);
      setFriendRequests(requestsRes.data.requests);
    } catch (error) {
      console.error('Error fetching friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      setProcessingRequest(requestId);
      await friendsAPI.respondToFriendRequest(requestId, action);
      
      if (action === 'accept') {
        // Move from requests to friends
        const request = friendRequests.find(req => req._id === requestId);
        if (request) {
          setFriends(prev => [...prev, request.from]);
        }
      }
      
      // Remove from requests
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Error responding to friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await friendsAPI.removeFriend(friendId);
      setFriends(prev => prev.filter(friend => friend._id !== friendId));
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleStartChat = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading friends...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Friends & Requests 👥
      </Typography>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Friend Requests ({friendRequests.length})
            </Typography>
            <List>
              {friendRequests.map((request, index) => (
                <React.Fragment key={request._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar src={request.from.avatar}>
                        {request.from.firstName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${request.from.firstName} ${request.from.lastName}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            @{request.from.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sent {formatLastSeen(request.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          color="success"
                          onClick={() => handleRespondToRequest(request._id, 'accept')}
                          disabled={processingRequest === request._id}
                        >
                          {processingRequest === request._id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Check />
                          )}
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleRespondToRequest(request._id, 'reject')}
                          disabled={processingRequest === request._id}
                        >
                          <Close />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < friendRequests.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Friends ({friends.length})
          </Typography>
          {friends.length > 0 ? (
            <List>
              {friends.map((friend, index) => (
                <React.Fragment key={friend._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar src={friend.avatar}>
                        {friend.firstName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>
                            {friend.firstName} {friend.lastName}
                          </Typography>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: friend.isOnline ? 'green' : 'gray',
                            }}
                          />
                          {friend.isOnline ? (
                            <Chip label="Online" size="small" color="success" />
                          ) : (
                            <Chip 
                              label={formatLastSeen(friend.lastSeen)} 
                              size="small" 
                              variant="outlined" 
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            @{friend.username}
                          </Typography>
                          {friend.bio && (
                            <Typography variant="body2" noWrap>
                              {friend.bio}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          color="primary"
                          onClick={() => handleStartChat(friend._id)}
                        >
                          <Chat />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveFriend(friend._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < friends.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No friends yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Start discovering people and send friend requests to build your network!
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => navigate('/discover')}
              >
                Discover People
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Friends;
