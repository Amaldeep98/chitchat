#!/bin/bash

# Chunked Installation Script for EC2 t2.micro
# Installs dependencies in small chunks to avoid CPU throttling

set -e

echo "🔧 Chunked Installation Script for EC2 t2.micro"
echo "=============================================="

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

print_status "Step 1: Create Minimal package.json"
echo "======================================"

cd client

# Backup original package.json
cp package.json package.json.backup

# Create a minimal package.json with only essential dependencies
print_status "Creating minimal package.json..."
cat > package.json << 'EOF'
{
  "name": "client",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

print_status "Step 2: Install Core Dependencies"
echo "===================================="

# Remove existing files
rm -rf build
rm -rf node_modules
rm -f package-lock.json

# Install core dependencies first
print_status "Installing core React dependencies..."
npm install react react-dom --no-audit --no-fund --no-package-lock

print_success "Core dependencies installed!"

print_status "Step 3: Install Build Tools"
echo "==============================="

# Install react-scripts
print_status "Installing react-scripts..."
npm install react-scripts --no-audit --no-fund --no-package-lock

print_success "Build tools installed!"

print_status "Step 4: Install Additional Dependencies"
echo "============================================"

# Install other dependencies one by one
print_status "Installing additional dependencies..."

# Install Material-UI components
npm install @mui/material @emotion/react @emotion/styled --no-audit --no-fund --no-package-lock
print_status "Material-UI installed"

npm install @mui/icons-material --no-audit --no-fund --no-package-lock
print_status "Material-UI icons installed"

# Install other essential packages
npm install axios --no-audit --no-fund --no-package-lock
print_status "Axios installed"

npm install react-router-dom --no-audit --no-fund --no-package-lock
print_status "React Router installed"

npm install socket.io-client --no-audit --no-fund --no-package-lock
print_status "Socket.io client installed"

npm install crypto-js --no-audit --no-fund --no-package-lock
print_status "Crypto-js installed"

print_status "Step 5: Install TypeScript Dependencies"
echo "==========================================="

# Install TypeScript dependencies
npm install typescript @types/react @types/react-dom @types/node --no-audit --no-fund --no-package-lock
print_status "TypeScript dependencies installed"

npm install @types/crypto-js @types/socket.io-client --no-audit --no-fund --no-package-lock
print_status "Additional TypeScript types installed"

print_status "Step 6: Build Application"
echo "============================"

# Set build environment variables
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false
export DISABLE_ESLINT_PLUGIN=true
export FAST_REFRESH=false

print_status "Starting build process..."
npm run build

print_status "Step 7: Restore Original package.json"
echo "=========================================="

# Restore original package.json
print_status "Restoring original package.json..."
cp package.json.backup package.json

# Install remaining dependencies
print_status "Installing remaining dependencies..."
npm install --no-audit --no-fund --no-package-lock

cd ..

print_status "Step 8: Verify Build"
echo "========================"

if [ -d "client/build" ] && [ -f "client/build/index.html" ]; then
    print_success "✅ Build completed successfully!"
    ls -la client/build/
    
    BUILD_SIZE=$(du -sh client/build | cut -f1)
    print_success "Build size: $BUILD_SIZE"
    
    print_success "Chunked installation and build completed!"
else
    print_error "Build failed! Trying static build as fallback..."
    ./build-static.sh
fi

print_success "Chunked installation completed!"
echo "======================================"
echo -e "${GREEN}✅ Chunked installation completed${NC}"
echo -e "${BLUE}Build location: client/build/${NC}"
echo -e "${BLUE}Build size: $(du -sh client/build | cut -f1)${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} Dependencies were installed in small chunks"
echo -e "${YELLOW}This helps avoid CPU throttling on t2.micro instances${NC}"
echo ""
echo -e "${GREEN}Chunked installation completed! 🚀${NC}"
