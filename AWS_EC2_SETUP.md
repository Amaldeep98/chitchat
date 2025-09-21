# AWS EC2 Setup Guide for Chit Chat Social App 🚀

This guide will help you deploy your Chit Chat social application on AWS EC2.

## Prerequisites

- AWS Account with EC2 access
- Basic knowledge of Linux commands
- Domain name (optional, for production)

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu Server 22.04 LTS** (Free tier eligible)
3. Select **t2.micro** instance type (Free tier)
4. Configure security group with these rules:
   - **SSH (22)** - Your IP only
   - **HTTP (80)** - Anywhere (0.0.0.0/0)
   - **HTTPS (443)** - Anywhere (0.0.0.0/0)
   - **Custom TCP (3000)** - Anywhere (0.0.0.0/0) - React dev server
   - **Custom TCP (5000)** - Anywhere (0.0.0.0/0) - Node.js server
5. Create or select a key pair
6. Launch instance

### 1.2 Connect to Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 2: Install Dependencies

### 2.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Node.js (v18+)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.3 Install MongoDB

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2.4 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 2.5 Install Nginx (Reverse Proxy)

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 3: Deploy Application

### 3.1 Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/Amaldeep98/chitchat.git chit-chat
cd chit-chat

# Check available branches and switch to correct one
git branch -a
git checkout master  # or main, depending on your repository's default branch
```

### 3.2 Install Dependencies

```bash
# Install all dependencies
npm run install-all
```

### 3.3 Configure Environment Variables

**Server Environment (`server/.env`):**

```bash
nano server/.env
```

```env
PORT=5000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/chitchat
JWT_SECRET=your-super-secure-jwt-secret-key-here
NODE_ENV=production

# Server URLs (replace with your EC2 public IP)
SERVER_URL=http://your-ec2-public-ip:5000
CLIENT_URL=http://your-ec2-public-ip:3000
```

**Client Environment (`client/.env`):**

```bash
nano client/.env
```

```env
# Replace with your EC2 public IP
REACT_APP_API_URL=http://your-ec2-public-ip:5000/api
REACT_APP_SOCKET_URL=http://your-ec2-public-ip:5000
REACT_APP_CLIENT_URL=http://your-ec2-public-ip:3000
```

### 3.4 Build React Application

```bash
# Stop any running processes first
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Method 1: Build using npm script (from root directory)
npm run build

# Method 2: If Method 1 causes infinite loop, use direct React Scripts
# cd client && npx react-scripts build && cd ..

# Verify build was successful
ls -la client/build/
```

**Note:** If `npm run build` causes infinite loops, use `cd client && npx react-scripts build && cd ..` instead.

## Step 4: Configure Nginx

### 4.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/chit-chat
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com your-ec2-public-ip;

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
```

### 4.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/chit-chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: Start Application with PM2

### 5.1 Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

Add this configuration:

```javascript
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
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

### 5.2 Start Application

```bash
# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js

# Check if it started successfully
pm2 status
pm2 logs chit-chat-server --lines 20

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown by the command above
```

## Step 6: SSL Certificate (Optional but Recommended)

### 6.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Get SSL Certificate

```bash
sudo certbot --nginx -d amal-dev.com
```

## Step 7: Firewall Configuration

### 7.1 Configure UFW

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Step 8: Monitoring and Maintenance

### 8.1 Check Application Status

```bash
pm2 status
pm2 logs chit-chat-server
```

### 8.2 Restart Application

```bash
pm2 restart chit-chat-server
```

### 8.3 Update Application

```bash
cd /home/ubuntu/chit-chat

# Check current branch and pull updates
git branch
git pull origin master  # or main, depending on your default branch

# Install any new dependencies
npm run install-all

# Build and restart
cd client && npm run build && cd ..
pm2 restart chit-chat-server
```

## Step 9: Database Setup (MongoDB Atlas Alternative)

If you prefer using MongoDB Atlas instead of local MongoDB:

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `server/.env`

## Troubleshooting

### Common Issues:

1. **Port Already in Use**

   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

2. **Permission Denied**

   ```bash
   sudo chown -R ubuntu:ubuntu /home/ubuntu/chit-chat
   ```

3. **Nginx Not Starting**

   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **PM2 Process Not Starting**

   ```bash
   pm2 logs chit-chat-server
   pm2 restart chit-chat-server
   ```

5. **Git Branch Error: "couldn't find remote ref main"**

   ```bash
   # Check available branches
   git branch -a

   # Switch to the correct branch (usually master)
   git checkout master

   # Or if it's main but not set as default
   git checkout main
   ```

6. **React Build Loop/Infinite Build**

   ```bash
   # Press Ctrl+C to stop the infinite loop

   # Make sure you're in the root directory
   cd /home/ubuntu/chit-chat

   # Stop all PM2 processes
   pm2 stop all
   pm2 delete all

   # Clear npm cache
   npm cache clean --force

   # Remove node_modules and reinstall
   rm -rf node_modules client/node_modules server/node_modules
   npm run install-all

   # Build from root directory (NOT from client directory)
   npm run build
   ```

7. **Environment Variables Not Loading**

   ```bash
   # Check if .env files exist
   ls -la server/.env client/.env

   # Verify content (be careful with sensitive data)
   cat server/.env
   cat client/.env
   ```

8. **Corrupted Client Directory Structure**

   ```bash
   # If you get "Cannot find module package.json" error
   cd /home/ubuntu/chit-chat
   
   # Check directory structure
   ls -la client/
   
   # If client directory is corrupted, restore from git
   rm -rf client
   git checkout master
   git pull origin master
   
   # Verify structure is restored
   ls -la client/package.json
   
   # Reinstall dependencies
   npm run install-all
   ```

## Security Considerations

1. **Update Security Groups**: Only allow necessary ports
2. **Use Strong Passwords**: For MongoDB and JWT secrets
3. **Regular Updates**: Keep system and dependencies updated
4. **Firewall**: Configure UFW properly
5. **SSL**: Always use HTTPS in production

## Cost Optimization

- Use **t2.micro** for development/testing
- Consider **t3.small** for production
- Use **Spot Instances** for non-critical workloads
- Set up **CloudWatch** monitoring

## Access Your Application

- **HTTP**: `http://your-ec2-public-ip`
- **HTTPS**: `https://your-domain.com` (if SSL configured)

---

**🎉 Congratulations!** Your Chit Chat social app is now running on AWS EC2!

For support, check the logs:

```bash
pm2 logs chit-chat-server
sudo tail -f /var/log/nginx/error.log
```
