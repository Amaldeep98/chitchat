#!/bin/bash

# Fix Blank Page Issue Script
# Resolves React app loading but showing blank page

set -e

echo "🔧 Fixing Blank Page Issue"
echo "=========================="

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

print_status "Step 1: Fix Permissions for Rebuild"
echo "======================================"

# Fix permissions for rebuild
sudo chown -R ubuntu:ubuntu /home/ubuntu/chit-chat
sudo chmod -R 755 /home/ubuntu/chit-chat
sudo chown -R ubuntu:ubuntu /home/ubuntu/chit-chat/client/build
sudo chmod -R 755 /home/ubuntu/chit-chat/client/build

print_success "Permissions fixed for rebuild"

print_status "Step 2: Update Client Environment"
echo "===================================="

# Update client environment for correct API URLs
cat > client/.env << 'EOF'
REACT_APP_API_URL=http://amal-dev.com/api
REACT_APP_SOCKET_URL=http://amal-dev.com
REACT_APP_CLIENT_URL=http://amal-dev.com
EOF

print_success "Client environment updated"

print_status "Step 3: Rebuild React App"
echo "============================"

cd client

# Set build environment variables
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false
export DISABLE_ESLINT_PLUGIN=true
export FAST_REFRESH=false

# Rebuild the app
print_status "Rebuilding React app..."
npm run build

cd ..

print_success "React app rebuilt successfully"

print_status "Step 4: Fix Nginx Configuration"
echo "=================================="

# Create proper Nginx configuration
sudo tee /etc/nginx/sites-available/chit-chat > /dev/null << 'EOF'
server {
    listen 80;
    server_name amal-dev.com www.amal-dev.com;

    # Root directory
    root /var/www/chit-chat;
    index index.html;

    # Serve static assets with proper MIME types
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Serve JavaScript files
    location ~* \.js$ {
        add_header Content-Type application/javascript;
        expires 1y;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    # Serve CSS files
    location ~* \.css$ {
        add_header Content-Type text/css;
        expires 1y;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    # Serve other static files
    location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$ {
        expires 1y;
        add_header Cache-Control "public";
        try_files $uri =404;
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

    # Serve React app (fallback for all other requests)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

print_success "Nginx configuration updated"

print_status "Step 5: Copy Build Files to Web Root"
echo "========================================"

# Create web directory if it doesn't exist
sudo mkdir -p /var/www/chit-chat

# Copy build files
sudo cp -r client/build/* /var/www/chit-chat/

# Fix ownership and permissions
sudo chown -R www-data:www-data /var/www/chit-chat
sudo chmod -R 644 /var/www/chit-chat
sudo chmod 755 /var/www/chit-chat

print_success "Build files copied to web root"

print_status "Step 6: Test Static Assets"
echo "============================"

# Test if static assets are served correctly
print_status "Testing static assets..."

JS_RESPONSE=$(curl -s -I http://amal-dev.com/static/js/main.311c9b45.js | grep "Content-Type")
CSS_RESPONSE=$(curl -s -I http://amal-dev.com/static/css/main.4efb37a3.css | grep "Content-Type")

echo "JavaScript response: $JS_RESPONSE"
echo "CSS response: $CSS_RESPONSE"

if [[ $JS_RESPONSE == *"application/javascript"* ]]; then
    print_success "JavaScript files serving correctly"
else
    print_warning "JavaScript files may not be serving correctly"
fi

if [[ $CSS_RESPONSE == *"text/css"* ]]; then
    print_success "CSS files serving correctly"
else
    print_warning "CSS files may not be serving correctly"
fi

print_status "Step 7: Test API Endpoints"
echo "============================="

# Test API endpoints
print_status "Testing API endpoints..."

API_HEALTH=$(curl -s http://amal-dev.com/api/health)
API_ROOT=$(curl -s http://amal-dev.com/api)

echo "API Health: $API_HEALTH"
echo "API Root: $API_ROOT"

if [[ $API_HEALTH == *"OK"* ]]; then
    print_success "API is working correctly"
else
    print_warning "API may have issues"
fi

print_status "Step 8: Final Verification"
echo "============================"

# Test the main page
print_status "Testing main page..."

MAIN_PAGE=$(curl -s http://amal-dev.com/ | grep -o '<title>.*</title>')
echo "Main page title: $MAIN_PAGE"

if [[ $MAIN_PAGE == *"React App"* ]]; then
    print_success "Main page is loading"
else
    print_warning "Main page may have issues"
fi

print_success "Blank page fix completed!"
echo "=============================="
echo -e "${GREEN}✅ All fixes applied successfully${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open http://amal-dev.com in your browser"
echo "2. Check browser console (F12) for any JavaScript errors"
echo "3. Check Network tab for failed requests"
echo ""
echo -e "${BLUE}If still blank:${NC}"
echo "- Check browser console for errors"
echo "- Ensure JavaScript is enabled"
echo "- Try hard refresh (Ctrl+F5)"
echo ""
echo -e "${GREEN}Blank page fix completed! 🚀${NC}"
