import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Avatar,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  PersonAdd,
  Chat,
  LocationOn,
  Cake,
  Interests,
  Close,
} from '@mui/icons-material';
import { usersAPI, friendsAPI } from '../../services/api';

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

const Discover: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    fetchRandomUsers();
  }, []);

  const fetchRandomUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getRandomUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchRandomUsers();
      return;
    }

    try {
      setLoading(true);
      const response = await usersAPI.searchUsers(searchQuery);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      setSendingRequest(true);
      await friendsAPI.sendFriendRequest(userId);
      
      // Remove user from list
      setUsers(prev => prev.filter(u => u._id !== userId));
      setProfileDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setProfileDialogOpen(true);
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

  if (loading && users.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Finding amazing people for you...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Discover People 🌟
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={() => { setSearchQuery(''); fetchRandomUsers(); }}>
                  <Close />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {users.map((user) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={user._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={user.avatar}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  >
                    {user.firstName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{user.username}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: user.isOnline ? 'green' : 'gray',
                          mr: 1,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {user.isOnline ? 'Online' : formatLastSeen(user.lastSeen)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {user.bio && (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {user.bio}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {user.location && (
                    <Chip
                      icon={<LocationOn />}
                      label={user.location}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {user.age && (
                    <Chip
                      icon={<Cake />}
                      label={`${user.age} years old`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                {user.interests.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <Interests sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Interests
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {user.interests.slice(0, 3).map((interest) => (
                        <Chip
                          key={interest}
                          label={interest}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      {user.interests.length > 3 && (
                        <Chip
                          label={`+${user.interests.length - 3} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="outlined"
                  onClick={() => handleViewProfile(user)}
                  fullWidth
                >
                  View Profile
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => handleSendFriendRequest(user._id)}
                  fullWidth
                >
                  Add Friend
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {users.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No users found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or check back later for new people to discover!
          </Typography>
        </Box>
      )}

      {/* Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={selectedUser?.avatar}
              sx={{ width: 50, height: 50, mr: 2 }}
            >
              {selectedUser?.firstName[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedUser?.firstName} {selectedUser?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{selectedUser?.username}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser?.bio && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedUser.bio}
            </Typography>
          )}
          
          {selectedUser?.interests && selectedUser.interests.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Interests
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedUser?.interests?.map((interest: string) => (
                  <Chip
                    key={interest}
                    label={interest}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => selectedUser && handleSendFriendRequest(selectedUser._id)}
            disabled={sendingRequest}
          >
            {sendingRequest ? <CircularProgress size={20} /> : 'Add Friend'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Discover;
