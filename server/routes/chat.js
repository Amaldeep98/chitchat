const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Get all unique conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $addFields: {
          otherUserId: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$otherUserId',
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            username: '$user.username',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            avatar: '$user.avatar',
            isOnline: '$user.isOnline',
            lastSeen: '$user.lastSeen'
          },
          lastMessage: {
            content: '$lastMessage.content',
            messageType: '$lastMessage.messageType',
            createdAt: '$lastMessage.createdAt',
            isRead: '$lastMessage.isRead'
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Calculate unread counts for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          sender: conv.user._id,
          receiver: userId,
          isRead: false
        });
        
        return {
          ...conv,
          unreadCount
        };
      })
    );

    res.json({ conversations: conversationsWithUnreadCount });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/:userId
// @desc    Get chat history with a specific user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // Get messages between users (no friends check needed)
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'username firstName lastName avatar')
    .populate('receiver', 'username firstName lastName avatar')
    .sort({ createdAt: 1 })
    .limit(100);

    res.json({ messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/send
// @desc    Send a message
// @access  Private
router.post('/send', auth, [
  body('receiverId').isMongoId().withMessage('Valid receiver ID is required'),
  body('content').notEmpty().withMessage('Message content is required'),
  body('messageType').optional().isIn(['text', 'image', 'file'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiverId, content, messageType = 'text' } = req.body;
    const senderId = req.userId;

    if (senderId === receiverId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Create message (no friends check needed)
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      messageType
    });

    await message.save();

    // Populate sender info for response
    await message.populate('sender', 'username firstName lastName avatar');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chat/message/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/message/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only receiver can mark as read
    if (message.receiver.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
