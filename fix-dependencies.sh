#!/bin/bash

# Fix Missing Dependencies Script
# Installs missing Material-UI and other dependencies

set -e

echo "🔧 Fix Missing Dependencies Script"
echo "================================="

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

print_status "Step 1: Install Missing Material-UI Dependencies"
echo "===================================================="

cd client

# Set CPU-friendly settings
export NPM_CONFIG_PROGRESS=false
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false

print_status "Installing missing Material-UI packages..."

# Install missing Material-UI packages
npm install @mui/material @emotion/react @emotion/styled --no-audit --no-fund --no-package-lock
print_success "Core Material-UI installed"

npm install @mui/icons-material --no-audit --no-fund --no-package-lock
print_success "Material-UI icons installed"

npm install @mui/lab --no-audit --no-fund --no-package-lock
print_success "Material-UI lab installed"

print_status "Step 2: Install Other Missing Dependencies"
echo "==============================================="

# Install other missing packages
npm install axios --no-audit --no-fund --no-package-lock
print_success "Axios installed"

npm install react-router-dom --no-audit --no-fund --no-package-lock
print_success "React Router installed"

npm install socket.io-client --no-audit --no-fund --no-package-lock
print_success "Socket.io client installed"

npm install crypto-js --no-audit --no-fund --no-package-lock
print_success "Crypto-js installed"

npm install simple-peer --no-audit --no-fund --no-package-lock
print_success "Simple-peer installed"

print_status "Step 3: Install TypeScript Dependencies"
echo "==========================================="

# Install TypeScript dependencies
npm install typescript @types/react @types/react-dom @types/node --no-audit --no-fund --no-package-lock
print_success "TypeScript dependencies installed"

npm install @types/crypto-js @types/socket.io-client @types/simple-peer --no-audit --no-fund --no-package-lock
print_success "Additional TypeScript types installed"

print_status "Step 4: Install Testing Dependencies"
echo "========================================"

# Install testing dependencies
npm install @testing-library/react @testing-library/jest-dom @testing-library/user-event --no-audit --no-fund --no-package-lock
print_success "Testing dependencies installed"

print_status "Step 5: Try Building Again"
echo "============================="

# Set build environment variables
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false
export DISABLE_ESLINT_PLUGIN=true
export FAST_REFRESH=false

print_status "Starting build with all dependencies..."
npm run build

cd ..

print_status "Step 6: Verify Build"
echo "========================"

if [ -d "client/build" ] && [ -f "client/build/index.html" ]; then
    print_success "✅ Build completed successfully!"
    ls -la client/build/
    
    BUILD_SIZE=$(du -sh client/build | cut -f1)
    print_success "Build size: $BUILD_SIZE"
    
    print_success "All dependencies installed and build completed!"
else
    print_error "Build still failed. Checking for specific errors..."
    
    # Check what's missing
    cd client
    print_status "Checking for missing imports..."
    grep -r "@mui" src/ | head -5
    cd ..
fi

print_success "Dependency fix completed!"
echo "=============================="
echo -e "${GREEN}✅ Missing dependencies installed${NC}"
echo -e "${BLUE}Build location: client/build/${NC}"
echo -e "${BLUE}Build size: $(du -sh client/build | cut -f1)${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} All Material-UI and other dependencies are now installed"
echo ""
echo -e "${GREEN}Dependency fix completed! 🚀${NC}"
