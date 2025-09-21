#!/bin/bash

# CPU-Optimized Build Script for EC2 t2.micro
# This script handles CPU throttling and performance issues

set -e

echo "🔧 CPU-Optimized Build Script for EC2 t2.micro"
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

print_status "Step 1: Check System Resources"
echo "=================================="

# Check CPU and memory
print_status "Checking system resources..."
echo "Memory:"
free -h
echo ""
echo "CPU Info:"
lscpu | grep -E "Model name|CPU\(s\)|Thread|Core"
echo ""
echo "Load Average:"
uptime

print_status "Step 2: CPU Optimization Settings"
echo "======================================"

# Set CPU-friendly npm settings
export NPM_CONFIG_PROGRESS=false
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false
export NPM_CONFIG_UPDATE_NOTIFIER=false
export NPM_CONFIG_CACHE_MAX=0
export NPM_CONFIG_CACHE_MIN=0

# Set Node.js to be less CPU intensive
export NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=128"

print_status "CPU optimization settings applied:"
echo "  NPM_CONFIG_PROGRESS: $NPM_CONFIG_PROGRESS"
echo "  NPM_CONFIG_AUDIT: $NPM_CONFIG_AUDIT"
echo "  NODE_OPTIONS: $NODE_OPTIONS"

print_status "Step 3: Install Dependencies with CPU Optimization"
echo "======================================================="

cd client

# Remove existing files
print_status "Cleaning up existing files..."
rm -rf build
rm -rf node_modules
rm -f package-lock.json

# Install with CPU-friendly settings
print_status "Installing dependencies with CPU optimization..."
print_warning "This may take 10-15 minutes on t2.micro due to CPU throttling..."

# Install with minimal CPU usage
npm install \
    --production \
    --no-optional \
    --no-audit \
    --no-fund \
    --no-package-lock \
    --prefer-offline \
    --progress=false \
    --silent \
    --no-update-notifier

print_success "Dependencies installed successfully!"

print_status "Step 4: Build with CPU Optimization"
echo "========================================"

# Set build environment variables for CPU efficiency
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false
export DISABLE_ESLINT_PLUGIN=true
export FAST_REFRESH=false
export CI=false

print_status "Starting CPU-optimized build..."
print_warning "Build process may take 15-20 minutes on t2.micro..."

# Build with CPU-friendly settings
npm run build

cd ..

print_status "Step 5: Verify Build"
echo "========================"

if [ -d "client/build" ] && [ -f "client/build/index.html" ]; then
    print_success "✅ Build completed successfully!"
    ls -la client/build/
    
    BUILD_SIZE=$(du -sh client/build | cut -f1)
    print_success "Build size: $BUILD_SIZE"
    
    print_success "React application built successfully!"
else
    print_error "Build failed! Trying alternative approach..."
    
    # Fallback to static build
    print_status "Running static build as fallback..."
    ./build-static.sh
fi

print_success "CPU-optimized build completed!"
echo "======================================"
echo -e "${GREEN}✅ Build process completed${NC}"
echo -e "${BLUE}Build location: client/build/${NC}"
echo -e "${BLUE}Build size: $(du -sh client/build | cut -f1)${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} t2.micro instances have CPU throttling"
echo -e "${YELLOW}For faster builds, consider upgrading to t3.small or larger${NC}"
echo ""
echo -e "${GREEN}CPU-optimized build completed! 🚀${NC}"
