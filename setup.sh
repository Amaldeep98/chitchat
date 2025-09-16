#!/bin/bash

echo "🚀 Setting up Chit Chat - Social Connection App"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   On Ubuntu/Debian: sudo systemctl start mongod"
    echo "   On macOS with Homebrew: brew services start mongodb-community"
    echo "   Or run: mongod"
fi

echo "📦 Installing root dependencies..."
npm install

echo "📦 Installing server dependencies..."
cd server
npm install

echo "📦 Installing client dependencies..."
cd ../client
npm install

echo "🔧 Setting up environment files..."

# Create server .env file
if [ ! -f server/.env ]; then
    echo "Creating server/.env file..."
    cp server/env.example server/.env
    echo "✅ Please edit server/.env with your MongoDB connection string and JWT secret"
fi

# Create client .env file
if [ ! -f client/.env ]; then
    echo "Creating client/.env file..."
    cp client/env.example client/.env
    echo "✅ Client environment file created"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit server/.env with your MongoDB connection string and JWT secret"
echo "2. Start MongoDB if not already running"
echo "3. Run the development servers:"
echo "   npm run dev"
echo ""
echo "🌐 The app will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo ""
echo "📚 For more information, check the README.md file"
