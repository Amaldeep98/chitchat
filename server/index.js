const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const Message = require('./models/Message');
const User = require('./models/User');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://192.168.0.102:3000"
    ],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:3000", 
    "http://192.168.0.102:3000"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chitchat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', async (userId) => {
    console.log('User joining room:', userId);
    socket.join(userId);
    socket.userId = userId; // Store userId for disconnect event
    console.log(`User ${userId} joined their room`);
    
    // Update user online status
    try {
      await User.findByIdAndUpdate(userId, { 
        isOnline: true, 
        lastSeen: new Date() 
      });
      
      // Notify other users that this user is online
      socket.broadcast.emit('user_online', { userId });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  });

  socket.on('send_message', async (data) => {
    try {
      console.log('Received send_message:', data);
      const { receiverId, message, senderId } = data;
      
      // Save message to database
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        content: message,
        messageType: 'text'
      });
      
      await newMessage.save();
      await newMessage.populate('sender', 'username firstName lastName avatar');
      
      // Emit to receiver
      console.log('Emitting receive_message to:', receiverId);
      socket.to(receiverId).emit('receive_message', {
        senderId,
        message,
        timestamp: newMessage.createdAt,
        messageId: newMessage._id
      });
      
      // Emit conversation update to both users
      io.to(senderId).emit('conversation_updated', {
        userId: receiverId,
        lastMessage: {
          content: message,
          createdAt: newMessage.createdAt,
          isRead: false
        }
      });
      
      io.to(receiverId).emit('conversation_updated', {
        userId: senderId,
        lastMessage: {
          content: message,
          createdAt: newMessage.createdAt,
          isRead: false
        }
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('mark_messages_read', async (data) => {
    try {
      const { messageIds, senderId } = data;
      
      // Mark messages as read
      await Message.updateMany(
        { _id: { $in: messageIds }, receiver: socket.userId },
        { isRead: true, readAt: new Date() }
      );
      
      // Notify sender that messages were read
      if (senderId) {
        io.to(senderId).emit('messages_read', {
          messageIds,
          senderId: senderId,
          readBy: socket.userId,
          readAt: new Date()
        });
      }
      
      // Notify the current user to update their unread count
      io.to(socket.userId).emit('messages_read', {
        messageIds,
        senderId: senderId,
        readBy: socket.userId,
        readAt: new Date()
      });
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Update user offline status
    try {
      // Find user by socket ID (we need to track this)
      const userId = socket.userId; // We'll set this when joining room
      if (userId) {
        await User.findByIdAndUpdate(userId, { 
          isOnline: false, 
          lastSeen: new Date() 
        });
        
        // Notify other users that this user is offline
        socket.broadcast.emit('user_offline', { userId });
      }
    } catch (error) {
      console.error('Error updating offline status:', error);
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested from:', req.headers.origin || req.headers.host);
  res.json({ 
    status: 'OK', 
    message: 'Chit Chat API is running',
    timestamp: new Date().toISOString(),
    server: 'Chit Chat Backend',
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces for network access

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Accessible from network at: http://192.168.0.102:${PORT}`);
});
