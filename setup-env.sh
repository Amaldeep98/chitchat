#!/bin/bash

# Environment Setup Script for Chit Chat App
# This script helps you switch between localhost and network IP configurations

echo "🚀 Chit Chat Environment Setup"
echo "=============================="
echo ""
echo "Choose your configuration:"
echo "1) Localhost (127.0.0.1) - for local development"
echo "2) Network IP (192.168.0.102) - for network access"
echo "3) Custom IP - enter your own IP"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "Setting up localhost configuration..."
        
        # Server .env
        cp server/env.example server/.env
        cat > server/.env << EOF
PORT=5000
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://chitchat_db:tykGKVXu9gfZ3HPa@chitchat.sizwf1p.mongodb.net/
JWT_SECRET=HYNXMS3gXm2ijR1SB/6PbExpGWVbtobNaO16abFtBDc=
NODE_ENV=development

# Server URLs
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
EOF

        # Client .env
        cp client/env.example client/.env
        cat > client/.env << EOF
# React App Environment Variables
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_CLIENT_URL=http://localhost:3000
EOF
        
        echo "✅ Localhost configuration set!"
        ;;
        
    2)
        echo "Setting up network IP configuration (192.168.0.102)..."
        
        # Server .env
        cp server/env.example server/.env
        cat > server/.env << EOF
PORT=5000
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://chitchat_db:tykGKVXu9gfZ3HPa@chitchat.sizwf1p.mongodb.net/
JWT_SECRET=HYNXMS3gXm2ijR1SB/6PbExpGWVbtobNaO16abFtBDc=
NODE_ENV=development

# Server URLs
SERVER_URL=http://192.168.0.102:5000
CLIENT_URL=http://192.168.0.102:3000
EOF

        # Client .env
        cp client/env.example client/.env
        cat > client/.env << EOF
# React App Environment Variables
REACT_APP_API_URL=http://192.168.0.102:5000/api
REACT_APP_SOCKET_URL=http://192.168.0.102:5000
REACT_APP_CLIENT_URL=http://192.168.0.102:3000
EOF
        
        echo "✅ Network IP configuration set!"
        ;;
        
    3)
        read -p "Enter your custom IP address: " custom_ip
        echo "Setting up custom IP configuration ($custom_ip)..."
        
        # Server .env
        cp server/env.example server/.env
        cat > server/.env << EOF
PORT=5000
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://chitchat_db:tykGKVXu9gfZ3HPa@chitchat.sizwf1p.mongodb.net/
JWT_SECRET=HYNXMS3gXm2ijR1SB/6PbExpGWVbtobNaO16abFtBDc=
NODE_ENV=development

# Server URLs
SERVER_URL=http://$custom_ip:5000
CLIENT_URL=http://$custom_ip:3000
EOF

        # Client .env
        cp client/env.example client/.env
        cat > client/.env << EOF
# React App Environment Variables
REACT_APP_API_URL=http://$custom_ip:5000/api
REACT_APP_SOCKET_URL=http://$custom_ip:5000
REACT_APP_CLIENT_URL=http://$custom_ip:3000
EOF
        
        echo "✅ Custom IP configuration set!"
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "To start the servers:"
echo "1. Backend: cd server && node index.js"
echo "2. Frontend: cd client && npm start"
echo ""
echo "Your app will be available at:"
if [ "$choice" = "1" ]; then
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
elif [ "$choice" = "2" ]; then
    echo "   Frontend: http://192.168.0.102:3000"
    echo "   Backend:  http://192.168.0.102:5000"
else
    echo "   Frontend: http://$custom_ip:3000"
    echo "   Backend:  http://$custom_ip:5000"
fi
