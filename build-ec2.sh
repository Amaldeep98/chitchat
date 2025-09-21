#!/bin/bash

# Memory-Optimized Build Script for EC2 t2.micro
# This script handles the JavaScript heap out of memory error

set -e

echo "🔧 Memory-Optimized Build Script for EC2 t2.micro"
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

# Check current memory usage
print_status "Checking system memory..."
free -h

# Check available disk space
print_status "Checking disk space..."
df -h

print_status "Step 1: Clean up system memory"
echo "=================================="

# Clear npm cache
print_status "Clearing npm cache..."
npm cache clean --force

# Clear system cache
print_status "Clearing system cache..."
sudo apt clean
sudo apt autoremove -y

# Clear temporary files
print_status "Clearing temporary files..."
sudo rm -rf /tmp/*
sudo rm -rf /var/tmp/*

print_status "Step 2: Optimize Node.js memory settings"
echo "============================================="

# Set very conservative memory limits
export NODE_OPTIONS="--max-old-space-size=256"
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false

print_status "Memory settings applied:"
echo "  NODE_OPTIONS: $NODE_OPTIONS"
echo "  GENERATE_SOURCEMAP: $GENERATE_SOURCEMAP"
echo "  INLINE_RUNTIME_CHUNK: $INLINE_RUNTIME_CHUNK"

print_status "Step 3: Build with memory optimization"
echo "============================================"

cd client

# Remove existing build directory to free space
if [ -d "build" ]; then
    print_status "Removing existing build directory..."
    rm -rf build
fi

# Remove node_modules to free memory
if [ -d "node_modules" ]; then
    print_status "Removing node_modules to free memory..."
    rm -rf node_modules
fi

# Reinstall with minimal memory usage
print_status "Reinstalling dependencies with minimal memory..."
npm install --no-optional --no-audit --no-fund

print_status "Starting memory-optimized build..."
echo "This may take several minutes on t2.micro..."

# Build with multiple attempts and memory optimization
for attempt in 1 2 3; do
    print_status "Build attempt $attempt/3..."
    
    if npm run build; then
        print_success "Build completed successfully on attempt $attempt!"
        break
    else
        print_warning "Build failed on attempt $attempt"
        
        if [ $attempt -lt 3 ]; then
            print_status "Cleaning up and retrying..."
            rm -rf build
            sleep 10
        else
            print_error "All build attempts failed"
            exit 1
        fi
    fi
done

cd ..

print_status "Step 4: Verify build"
echo "======================"

if [ -d "client/build" ]; then
    print_success "Build directory created successfully!"
    ls -la client/build/
    
    # Check build size
    BUILD_SIZE=$(du -sh client/build | cut -f1)
    print_success "Build size: $BUILD_SIZE"
else
    print_error "Build directory not found!"
    exit 1
fi

print_status "Step 5: Alternative build method (if needed)"
echo "================================================"

# If the above fails, try this alternative method
if [ ! -f "client/build/index.html" ]; then
    print_warning "Standard build failed, trying alternative method..."
    
    cd client
    
    # Try building with even more aggressive memory settings
    export NODE_OPTIONS="--max-old-space-size=128"
    
    # Create a minimal package.json for build
    cat > package-build.json << 'EOF'
{
  "name": "client-build",
  "version": "1.0.0",
  "scripts": {
    "build": "react-scripts build"
  },
  "dependencies": {
    "react-scripts": "5.0.1"
  }
}
EOF
    
    # Try building with minimal setup
    print_status "Trying minimal build setup..."
    GENERATE_SOURCEMAP=false npm run build
    
    cd ..
fi

print_success "Build process completed!"
echo "================================"
echo -e "${GREEN}✅ React application built successfully${NC}"
echo -e "${BLUE}Build location: client/build/${NC}"
echo -e "${BLUE}Build size: $(du -sh client/build | cut -f1)${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure Nginx to serve the build files"
echo "2. Start your Node.js server with PM2"
echo "3. Test your application"
echo ""
echo -e "${GREEN}Memory-optimized build completed! 🚀${NC}"
