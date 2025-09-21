#!/bin/bash

# AWS EC2 Deployment Script for Chit Chat Social App
# This script sets up everything from scratch on EC2

set -e  # Exit on any error

echo "🚀 Starting Chit Chat Social App Deployment on AWS EC2"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for user confirmation
wait_for_confirmation() {
    echo -e "${YELLOW}Press Enter to continue or Ctrl+C to abort...${NC}"
    read -r
}

print_status "Step 1: System Update and Cleanup"
echo "=================================="

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Clean up any existing installations
print_status "Cleaning up existing installations..."
sudo apt autoremove -y
sudo apt autoclean

print_success "System updated successfully"

print_status "Step 2: Installing Dependencies"
echo "=================================="

# Install Node.js if not present
if ! command_exists node; then
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_warning "Node.js already installed: $(node --version)"
fi

# Install MongoDB if not present
if ! command_exists mongod; then
    print_status "Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
    print_success "MongoDB installed and started"
else
    print_warning "MongoDB already installed"
fi

# Install PM2 if not present
if ! command_exists pm2; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
    print_success "PM2 installed"
else
    print_warning "PM2 already installed"
fi

# Install Nginx if not present
if ! command_exists nginx; then
    print_status "Installing Nginx..."
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx installed and started"
else
    print_warning "Nginx already installed"
fi

print_status "Step 3: Project Setup"
echo "========================="

# Stop any running processes
print_status "Stopping any running processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f npm 2>/dev/null || true
pkill -f node 2>/dev/null || true

# Remove existing project directory
if [ -d "/home/ubuntu/chit-chat" ]; then
    print_status "Removing existing project directory..."
    rm -rf /home/ubuntu/chit-chat
fi

# Clone fresh repository
print_status "Cloning repository..."
cd /home/ubuntu
git clone https://github.com/Amaldeep98/chitchat.git chit-chat
cd chit-chat

# Check and switch to correct branch
print_status "Checking git branches..."
git branch -a
git checkout master

print_success "Repository cloned successfully"

print_status "Step 4: Environment Configuration"
echo "===================================="

# Create server environment file
print_status "Creating server environment file..."
cat > server/.env << 'EOF'
PORT=5000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/chitchat
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
NODE_ENV=production

# Server URLs (replace with your EC2 public IP)
SERVER_URL=http://YOUR_EC2_PUBLIC_IP:5000
CLIENT_URL=http://YOUR_EC2_PUBLIC_IP:3000
EOF

# Create client environment file
print_status "Creating client environment file..."
cat > client/.env << 'EOF'
# Replace with your EC2 public IP
REACT_APP_API_URL=http://YOUR_EC2_PUBLIC_IP:5000/api
REACT_APP_SOCKET_URL=http://YOUR_EC2_PUBLIC_IP:5000
REACT_APP_CLIENT_URL=http://YOUR_EC2_PUBLIC_IP:3000
EOF

print_warning "IMPORTANT: Please update the IP addresses in server/.env and client/.env files!"
print_warning "Replace 'YOUR_EC2_PUBLIC_IP' with your actual EC2 public IP address"

wait_for_confirmation

print_status "Step 5: Installing Dependencies"
echo "=================================="

# Clear npm cache
print_status "Clearing npm cache..."
npm cache clean --force

# Install all dependencies
print_status "Installing all dependencies..."
npm run install-all

print_success "Dependencies installed successfully"

print_status "Step 6: Building React Application"
echo "======================================"

# Build React application with memory optimization
print_status "Building React application..."
cd client

# Set memory limit for build process
export NODE_OPTIONS="--max-old-space-size=512"

# Build with minimal source maps to save memory
GENERATE_SOURCEMAP=false npm run build

cd ..

# Verify build
if [ -d "client/build" ]; then
    print_success "React application built successfully"
    ls -la client/build/
else
    print_error "Build failed! Build directory not found"
    exit 1
fi

print_status "Step 7: Nginx Configuration"
echo "=============================="

# Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/chit-chat > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # Serve React app
    location / {
        root /home/ubuntu/chit-chat/client/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js server
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy Socket.io requests
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/chit-chat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
print_status "Reloading Nginx..."
sudo systemctl reload nginx

print_success "Nginx configured successfully"

print_status "Step 8: PM2 Configuration"
echo "============================"

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem file..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "chit-chat-server",
      script: "server/index.js",
      cwd: "/home/ubuntu/chit-chat",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
EOF

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup
print_status "Setting up PM2 startup..."
pm2 startup

print_success "PM2 configured successfully"

print_status "Step 9: Firewall Configuration"
echo "=================================="

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

print_success "Firewall configured successfully"

print_status "Step 10: Final Verification"
echo "==============================="

# Check application status
print_status "Checking application status..."
pm2 status

# Check if services are running
print_status "Checking services..."
sudo systemctl status mongod --no-pager
sudo systemctl status nginx --no-pager

# Get EC2 public IP
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

print_success "Deployment completed successfully!"
echo "=================================================="
echo -e "${GREEN}🎉 Your Chit Chat Social App is now running!${NC}"
echo ""
echo -e "${BLUE}Access your application at:${NC}"
echo -e "  HTTP:  http://${EC2_PUBLIC_IP}"
echo -e "  HTTPS: https://${EC2_PUBLIC_IP} (if SSL configured)"
echo ""
echo -e "${BLUE}Application Status:${NC}"
pm2 status
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  pm2 status                    # Check app status"
echo "  pm2 logs chit-chat-server     # View logs"
echo "  pm2 restart chit-chat-server  # Restart app"
echo "  sudo systemctl status nginx   # Check Nginx"
echo "  sudo systemctl status mongod   # Check MongoDB"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update IP addresses in server/.env and client/.env files"
echo "2. Configure SSL certificate (optional)"
echo "3. Set up domain name (optional)"
echo "4. Configure MongoDB Atlas (optional)"
echo ""
echo -e "${GREEN}Deployment completed! 🚀${NC}"
