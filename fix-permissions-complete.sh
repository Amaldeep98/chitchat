#!/bin/bash

echo "🔧 Complete Permission and File Serving Fix"
echo "=========================================="

# Step 1: Stop PM2 to free up memory
echo ""
echo "[INFO] Step 1: Stopping PM2 processes"
echo "====================================="
pm2 stop all 2>/dev/null || true

# Step 2: Clean everything
echo ""
echo "[INFO] Step 2: Cleaning old files"
echo "================================"
sudo rm -rf /var/www/chit-chat/*
sudo rm -rf /home/ubuntu/chit-chat/client/build

# Step 3: Rebuild React app
echo ""
echo "[INFO] Step 3: Rebuilding React app"
echo "=================================="
cd /home/ubuntu/chit-chat/client
npm run build
cd ..

# Step 4: Create web directory with correct permissions
echo ""
echo "[INFO] Step 4: Setting up web directory"
echo "======================================"
sudo mkdir -p /var/www/chit-chat
sudo chown -R ubuntu:ubuntu /var/www/chit-chat
sudo chmod -R 755 /var/www/chit-chat

# Step 5: Copy files with correct ownership
echo ""
echo "[INFO] Step 5: Copying build files"
echo "================================="
cp -r client/build/* /var/www/chit-chat/
sudo chown -R www-data:www-data /var/www/chit-chat
sudo chmod -R 755 /var/www/chit-chat
sudo chmod -R 644 /var/www/chit-chat/static/*

# Step 6: Fix static directory permissions specifically
echo ""
echo "[INFO] Step 6: Fixing static directory permissions"
echo "================================================="
sudo chmod 755 /var/www/chit-chat/static
sudo chmod 755 /var/www/chit-chat/static/js
sudo chmod 755 /var/www/chit-chat/static/css
sudo chmod 644 /var/www/chit-chat/static/js/*
sudo chmod 644 /var/www/chit-chat/static/css/*

# Step 7: Update Nginx configuration
echo ""
echo "[INFO] Step 7: Updating Nginx configuration"
echo "=========================================="
sudo tee /etc/nginx/sites-available/chit-chat > /dev/null << 'EOF'
server {
    listen 80;
    server_name amal-dev.com www.amal-dev.com;
    
    root /var/www/chit-chat;
    index index.html;

    # Serve static files directly
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$ {
        expires 1y;
        add_header Cache-Control "public";
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io proxy
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # React app fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Step 8: Test and reload Nginx
echo ""
echo "[INFO] Step 8: Testing and reloading Nginx"
echo "========================================"
sudo nginx -t
sudo systemctl reload nginx

# Step 9: Restart PM2
echo ""
echo "[INFO] Step 9: Restarting PM2"
echo "============================"
pm2 start ecosystem.config.js

# Step 10: Verify everything
echo ""
echo "[INFO] Step 10: Verification"
echo "=========================="
echo "Checking file permissions:"
ls -la /var/www/chit-chat/static/
echo ""
echo "Checking static files:"
ls -la /var/www/chit-chat/static/js/
ls -la /var/www/chit-chat/static/css/
echo ""
echo "Testing static assets:"
curl -I http://amal-dev.com/static/js/main.1ae0f71a.js 2>/dev/null | head -3
curl -I http://amal-dev.com/static/css/main.4efb37a3.css 2>/dev/null | head -3
echo ""
echo "Testing main page:"
curl -s http://amal-dev.com/ | head -5
echo ""
echo "Testing API:"
curl -s http://amal-dev.com/api/health | head -3

echo ""
echo "✅ Complete fix applied!"
echo "======================"
echo "Now test http://amal-dev.com in your browser"
echo "The static assets should now load correctly!"
