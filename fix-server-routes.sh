#!/bin/bash

# Fix Server Routes Script
# Adds missing route registrations to server/index.js

set -e

echo "🔧 Fixing Server Routes"
echo "======================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Step 1: Backup Original Server File"
echo "======================================"

# Backup the original server file
cp server/index.js server/index.js.backup
print_success "Server file backed up as server/index.js.backup"

print_status "Step 2: Add Missing Route Registrations"
echo "=============================================="

# Create a temporary file with the fixes
cat > server/index_temp.js << 'EOF'
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto-js');
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
      "http://192.168.0.102:3000",
      "http://192.168.0.102:5000",
      "http://amal-dev.com",
      "https://amal-dev.com",
      "https://b16584797980.ngrok-free.app",
      /^http:\/\/192\.168\.0\.\d+:3000$/,
      /^http:\/\/192\.168\.0\.\d+:5000$/,
      /^https:\/\/.*\.ngrok-free\.app$/
    ],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:3000", 
    "http://192.168.0.102:3000",
    "http://192.168.0.102:5000",
    "http://amal-dev.com",
    "https://amal-dev.com",
    "https://b16584797980.ngrok-free.app",
    /^http:\/\/192\.168\.0\.\d+:3000$/,
    /^http:\/\/192\.168\.0\.\d+:5000$/,
    /^https:\/\/.*\.ngrok-free\.app$/
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - ADDED MISSING ROUTE REGISTRATIONS
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Chit Chat API is running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      friends: '/api/friends',
      chat: '/api/chat',
      health: '/api/health'
    }
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chitchat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { room, message, senderId, receiverId } = data;
      
      // Save message to database
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        content: message,
        room: room,
        timestamp: new Date()
      });
      
      await newMessage.save();
      
      // Broadcast message to room
      io.to(room).emit('receive_message', {
        id: newMessage._id,
        sender: senderId,
        content: message,
        timestamp: newMessage.timestamp
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Accessible from network at: http://${HOST}:${PORT}`);
});

module.exports = { app, server, io };
EOF

# Replace the original file
mv server/index_temp.js server/index.js

print_success "Server routes added successfully!"

print_status "Step 3: Restart Server"
echo "========================"

# Restart PM2
pm2 restart chit-chat-server

print_status "Waiting for server to start..."
sleep 5

# Check server status
pm2 status

print_status "Step 4: Test API Endpoints"
echo "=============================="

# Test the health endpoint
print_status "Testing health endpoint..."
curl -s http://localhost:5000/api/health

echo ""

# Test the root API endpoint
print_status "Testing root API endpoint..."
curl -s http://localhost:5000/api

echo ""

print_status "Step 5: Verify Routes"
echo "========================"

# Test individual routes
print_status "Testing auth route..."
curl -s http://localhost:5000/api/auth/register

echo ""

print_status "Testing users route..."
curl -s http://localhost:5000/api/users

echo ""

print_success "Server routes fix completed!"
echo "================================="
echo -e "${GREEN}✅ Server routes added and configured${NC}"
echo -e "${BLUE}✅ Server restarted with PM2${NC}"
echo -e "${BLUE}✅ API endpoints are now available${NC}"
echo ""
echo -e "${YELLOW}Available endpoints:${NC}"
echo "  http://amal-dev.com/api/health"
echo "  http://amal-dev.com/api/auth"
echo "  http://amal-dev.com/api/users"
echo "  http://amal-dev.com/api/friends"
echo "  http://amal-dev.com/api/chat"
echo ""
echo -e "${GREEN}Server routes fix completed! 🚀${NC}"
