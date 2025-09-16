# Chit Chat - Social Connection App 💬

A modern social app inspired by WeChat, designed to help people connect with random users and make new friends. Built with React, Node.js, and MongoDB.

![Chit Chat Logo](https://via.placeholder.com/400x200/1976d2/ffffff?text=Chit+Chat)

## ✨ Features

- 🔐 **User Authentication** - Secure registration and login with JWT tokens
- 👤 **Profile Management** - Complete user profiles with bio, interests, and avatar
- 🎯 **Random Discovery** - Find and connect with random people
- 🔍 **User Search** - Search for users by name or username
- 👥 **Friend System** - Send, accept, and manage friend requests
- 💬 **Real-time Chat** - Instant messaging with Socket.io
- 📱 **Responsive Design** - Works perfectly on mobile and desktop
- 🌐 **Modern UI** - Beautiful Material-UI components

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Material-UI (MUI)** for modern UI components
- **React Router** for navigation
- **Socket.io Client** for real-time communication
- **Axios** for API calls

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time chat
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SOCIAL
   ```

2. **Run the setup script**

   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure environment variables**

   - Edit `server/.env` with your MongoDB connection string and JWT secret
   - The client `.env` file is already configured

4. **Start MongoDB** (if not already running)

   ```bash
   # Ubuntu/Debian
   sudo systemctl start mongod

   # macOS with Homebrew
   brew services start mongodb-community

   # Or run directly
   mongod
   ```

5. **Start the development servers**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
SOCIAL/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── chat/       # Chat components
│   │   │   ├── discover/   # User discovery
│   │   │   ├── friends/    # Friends management
│   │   │   ├── layout/     # Layout components
│   │   │   └── profile/    # Profile management
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── App.tsx         # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── index.js            # Server entry point
│   └── package.json
├── package.json            # Root package.json
├── setup.sh               # Setup script
└── README.md              # This file
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Users

- `GET /api/users/random` - Get random users for discovery
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/avatar` - Update user avatar

### Friends

- `POST /api/friends/request` - Send friend request
- `GET /api/friends/requests` - Get friend requests
- `PUT /api/friends/request/:id` - Accept/reject friend request
- `GET /api/friends` - Get user's friends
- `DELETE /api/friends/:id` - Remove friend

### Chat

- `GET /api/chat/:userId` - Get chat history
- `POST /api/chat/send` - Send message
- `PUT /api/chat/message/:id/read` - Mark message as read
- `GET /api/chat/conversations` - Get all conversations

## 🎯 Key Features Explained

### Random User Discovery

The app uses MongoDB aggregation to find random users excluding the current user and their existing friends. This ensures fresh connections and prevents duplicate suggestions.

### Real-time Chat

Powered by Socket.io, the chat system provides instant messaging with:

- Real-time message delivery
- Online/offline status
- Message read receipts
- Chat history persistence

### Friend System

A comprehensive friend management system with:

- Friend request sending and receiving
- Request acceptance/rejection
- Friend list management
- Mutual friend connections

### Profile Management

Users can create detailed profiles with:

- Personal information (name, age, location)
- Bio and interests
- Avatar upload via URL
- Privacy controls

## 🔧 Development

### Available Scripts

```bash
# Root level
npm run dev          # Start both frontend and backend
npm run install-all  # Install all dependencies

# Server
cd server
npm run dev          # Start server with nodemon
npm start            # Start server in production

# Client
cd client
npm start            # Start React development server
npm run build        # Build for production
npm test             # Run tests
```

### Environment Variables

#### Server (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chitchat
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

#### Client (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚀 Deployment

### Backend Deployment

1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Update `MONGODB_URI` in production environment
3. Set a strong `JWT_SECRET`
4. Deploy to platforms like Heroku, Vercel, or AWS

### Frontend Deployment

1. Build the React app: `npm run build`
2. Deploy the build folder to platforms like Netlify, Vercel, or AWS S3
3. Update `REACT_APP_API_URL` to point to your production backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📱 Mobile App Development

This web app is designed to be easily converted to a mobile app using:

- **React Native** - Convert React components to native mobile
- **Expo** - Rapid mobile development platform
- **Ionic** - Hybrid mobile app framework

The API is already mobile-ready and can be consumed by any mobile framework.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify MongoDB service status

2. **Port Already in Use**

   - Change ports in `.env` files
   - Kill existing processes: `lsof -ti:5000 | xargs kill`

3. **CORS Issues**

   - Check CORS configuration in server
   - Verify frontend URL in server CORS settings

4. **Socket.io Connection Issues**
   - Ensure both frontend and backend are running
   - Check Socket.io configuration
   - Verify network connectivity

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Material-UI for the beautiful component library
- Socket.io for real-time communication
- MongoDB for the flexible database
- React team for the amazing framework

---

**Made with ❤️ for connecting people around the world**
