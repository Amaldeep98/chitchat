import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  TextField,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Add,
  Delete,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    age: user?.age?.toString() || '',
    location: user?.location || '',
    interests: user?.interests || [],
  });

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interestInput.trim()],
      });
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((i: string) => i !== interest),
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      const updateData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
      };

      const response = await usersAPI.updateProfile(updateData);
      updateUser(response.data.user);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      age: user?.age?.toString() || '',
      location: user?.location || '',
      interests: user?.interests || [],
    });
    setIsEditing(false);
    setError('');
  };

  const handleAvatarUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await usersAPI.updateAvatar(avatarUrl);
      updateUser(response.data.user);
      setAvatarDialogOpen(false);
      setSuccess('Avatar updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError('');
      
      await authAPI.deleteAccount();
      
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      
      setSuccess('Account deleted successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Profile 👤
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Avatar Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            src={user?.avatar}
            sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
          >
            {user?.firstName?.[0]}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            @{user?.username}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setAvatarDialogOpen(true)}
            sx={{ mt: 1 }}
          >
            Change Avatar
          </Button>
        </Box>

        {/* Profile Form */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Bio"
              name="bio"
              multiline
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" gutterBottom>
              Interests
            </Typography>
            {isEditing ? (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add Interest"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInterest();
                      }
                    }}
                  />
                  <Button variant="outlined" onClick={handleAddInterest}>
                    <Add />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.interests.map((interest: string) => (
                    <Chip
                      key={interest}
                      label={interest}
                      onDelete={() => handleRemoveInterest(interest)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.interests.map((interest: string) => (
                  <Chip
                    key={interest}
                    label={interest}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
          {!isEditing ? (
            <>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ ml: 2 }}
              >
                Delete Account
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                onClick={handleSave}
                disabled={loading}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Paper>

      {/* Avatar Dialog */}
      <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Avatar</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Avatar URL"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="https://example.com/avatar.jpg"
          />
          {avatarUrl && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Avatar
                src={avatarUrl}
                sx={{ width: 100, height: 100, mx: 'auto' }}
              >
                Preview
              </Avatar>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAvatarUpdate}
            disabled={loading || !avatarUrl.trim()}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Avatar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Delete Account
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete:
          </Typography>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Your profile and personal information</li>
            <li>All your messages and chat history</li>
            <li>Your friends list and connections</li>
            <li>All your posts and activities</li>
          </ul>
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>Warning:</strong> This action is irreversible. Please make sure you want to proceed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
