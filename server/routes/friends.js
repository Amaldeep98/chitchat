const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/friends/request
// @desc    Send friend request
// @access  Private
router.post('/request', auth, [
  body('userId').isMongoId().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;
    const currentUserId = req.userId;

    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if already friends
    if (currentUser.friends.includes(userId)) {
      return res.status(400).json({ message: 'Already friends with this user' });
    }

    // Check if request already exists
    const existingRequest = targetUser.friendRequests.find(
      req => req.from.toString() === currentUserId && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Add friend request
    targetUser.friendRequests.push({
      from: currentUserId,
      status: 'pending'
    });

    await targetUser.save();

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/friends/requests
// @desc    Get friend requests
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friendRequests.from', 'username firstName lastName avatar');

    const pendingRequests = user.friendRequests.filter(req => req.status === 'pending');

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/friends/request/:requestId
// @desc    Accept or reject friend request
// @access  Private
router.put('/request/:requestId', auth, [
  body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { action } = req.body;

    const user = await User.findById(req.userId);
    const request = user.friendRequests.id(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    request.status = action === 'accept' ? 'accepted' : 'rejected';

    if (action === 'accept') {
      // Add to friends list for both users
      user.friends.push(request.from);
      
      const requester = await User.findById(request.from);
      requester.friends.push(user._id);
      await requester.save();
    }

    await user.save();

    res.json({ 
      message: `Friend request ${action}ed successfully`,
      action 
    });
  } catch (error) {
    console.error('Process friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/friends
// @desc    Get user's friends
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username firstName lastName avatar bio isOnline lastSeen');

    res.json({ friends: user.friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/friends/:friendId
// @desc    Remove friend
// @access  Private
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.userId;

    // Remove from both users' friends list
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: friendId }
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: currentUserId }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
