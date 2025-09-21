#!/bin/bash

# Comprehensive Build Fix Script
# Fixes all known build issues for EC2 deployment

set -e

echo "🔧 Comprehensive Build Fix Script"
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

print_status "Step 1: Install All Missing Dependencies"
echo "============================================="

cd client

# Set CPU-friendly settings
export NPM_CONFIG_PROGRESS=false
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false

print_status "Installing Material-UI packages..."
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/lab --no-audit --no-fund --no-package-lock

print_status "Installing core dependencies..."
npm install axios react-router-dom socket.io-client crypto-js simple-peer web-vitals --no-audit --no-fund --no-package-lock

print_status "Installing TypeScript types..."
npm install @types/crypto-js @types/socket.io-client @types/simple-peer @types/jest @types/react @types/react-dom @types/node --no-audit --no-fund --no-package-lock

print_status "Installing testing dependencies..."
npm install @testing-library/dom @testing-library/jest-dom @testing-library/react @testing-library/user-event --no-audit --no-fund --no-package-lock

print_success "All dependencies installed!"

print_status "Step 2: Fix web-vitals Compatibility"
echo "========================================"

# Fix web-vitals compatibility issue
if [ -f "src/reportWebVitals.ts" ]; then
    print_status "Fixing web-vitals compatibility..."
    
    # Backup original file
    cp src/reportWebVitals.ts src/reportWebVitals.ts.backup
    
    # Create compatible version
    cat > src/reportWebVitals.ts << 'EOF'
const reportWebVitals = (onPerfEntry?: any) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
EOF
    
    print_success "web-vitals compatibility fixed"
else
    print_warning "reportWebVitals.ts not found, skipping web-vitals fix"
fi

print_status "Step 3: Build Application"
echo "============================="

# Set build environment variables
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false
export DISABLE_ESLINT_PLUGIN=true
export FAST_REFRESH=false

print_status "Starting build process..."
npm run build

cd ..

print_status "Step 4: Verify Build"
echo "========================"

if [ -d "client/build" ] && [ -f "client/build/index.html" ]; then
    print_success "✅ Build completed successfully!"
    ls -la client/build/
    
    BUILD_SIZE=$(du -sh client/build | cut -f1)
    print_success "Build size: $BUILD_SIZE"
    
    print_success "🎉 All build issues fixed and application built successfully!"
else
    print_error "Build failed. Check the error messages above."
    exit 1
fi

print_success "Comprehensive build fix completed!"
echo "========================================"
echo -e "${GREEN}✅ All build issues resolved${NC}"
echo -e "${BLUE}Build location: client/build/${NC}"
echo -e "${BLUE}Build size: $(du -sh client/build | cut -f1)${NC}"
echo ""
echo -e "${YELLOW}Fixed issues:${NC}"
echo "✅ Missing Material-UI dependencies"
echo "✅ Missing TypeScript types"
echo "✅ web-vitals compatibility"
echo "✅ Missing testing dependencies"
echo "✅ Missing core dependencies"
echo ""
echo -e "${GREEN}Comprehensive build fix completed! 🚀${NC}"
