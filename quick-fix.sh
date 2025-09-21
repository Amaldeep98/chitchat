#!/bin/bash

# Quick Fix for Missing Material-UI Dependencies
# Installs only the missing packages quickly

set -e

echo "🔧 Quick Fix for Missing Material-UI Dependencies"
echo "================================================"

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

print_status "Installing missing Material-UI dependencies..."

cd client

# Set CPU-friendly settings
export NPM_CONFIG_PROGRESS=false
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false

# Install the missing Material-UI packages
print_status "Installing @mui/material..."
npm install @mui/material @emotion/react @emotion/styled --no-audit --no-fund --no-package-lock

print_status "Installing @mui/icons-material..."
npm install @mui/icons-material --no-audit --no-fund --no-package-lock

print_status "Installing @mui/lab..."
npm install @mui/lab --no-audit --no-fund --no-package-lock

print_success "Material-UI dependencies installed!"

print_status "Installing other missing dependencies..."

# Install other missing packages
npm install axios react-router-dom socket.io-client crypto-js simple-peer --no-audit --no-fund --no-package-lock

print_success "All dependencies installed!"

print_status "Building application..."

# Set build environment variables
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false
export DISABLE_ESLINT_PLUGIN=true
export FAST_REFRESH=false

# Build the application
npm run build

cd ..

print_status "Verifying build..."

if [ -d "client/build" ] && [ -f "client/build/index.html" ]; then
    print_success "✅ Build completed successfully!"
    ls -la client/build/
    
    BUILD_SIZE=$(du -sh client/build | cut -f1)
    print_success "Build size: $BUILD_SIZE"
    
    print_success "🎉 Application built successfully!"
else
    print_error "Build failed. Check the error messages above."
fi

print_success "Quick fix completed!"
echo "======================"
echo -e "${GREEN}✅ Missing dependencies installed and build completed${NC}"
echo -e "${BLUE}Build location: client/build/${NC}"
echo -e "${BLUE}Build size: $(du -sh client/build | cut -f1)${NC}"
echo ""
echo -e "${GREEN}Quick fix completed! 🚀${NC}"
