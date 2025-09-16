const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/random
// @desc    Get random users for discovery (excluding current user and friends)
// @access  Private
router.get('/random', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get IDs to exclude (current user + friends)
    const excludeIds = [req.userId, ...currentUser.friends];

    // Get random users (limit to 10)
    const randomUsers = await User.find({
      _id: { $nin: excludeIds }
    })
    .select('username firstName lastName bio avatar age location interests isOnline lastSeen')
    .limit(10)
    .sort({ createdAt: -1 });

    res.json({ users: randomUsers });
  } catch (error) {
    console.error('Get random users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by username or name
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const currentUser = await User.findById(req.userId);
    const excludeIds = [req.userId, ...currentUser.friends];

    const users = await User.find({
      _id: { $nin: excludeIds },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username firstName lastName bio avatar age location interests isOnline lastSeen')
    .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username firstName lastName bio avatar age location interests isOnline lastSeen createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isLength({ min: 1, max: 50 }),
  body('bio').optional().isLength({ max: 500 }),
  body('age').optional().isInt({ min: 13, max: 120 }),
  body('location').optional().isLength({ max: 100 }),
  body('interests').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, bio, age, location, interests } = req.body;
    
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (age !== undefined) updateData.age = age;
    if (location !== undefined) updateData.location = location;
    if (interests !== undefined) updateData.interests = interests;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/avatar
// @desc    Update user avatar
// @access  Private
router.put('/avatar', auth, [
  body('avatar').notEmpty().withMessage('Avatar URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Avatar updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
