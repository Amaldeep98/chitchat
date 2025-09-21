#!/bin/bash

# Manual Build Script - Bypass npm install entirely
# For extreme memory constraints on EC2 t2.micro

set -e

echo "🔧 Manual Build Script - No npm install required"
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

print_status "Step 1: Create Basic HTML Structure"
echo "======================================"

cd client

# Remove existing build
rm -rf build
mkdir -p build

print_status "Creating basic HTML structure..."

# Create a functional HTML file
cat > build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Chit Chat Social App" />
    <title>Chit Chat</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            margin-bottom: 20px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .nav { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
        }
        .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #667eea; 
        }
        .nav-buttons { 
            display: flex; 
            gap: 10px; 
        }
        .btn { 
            padding: 10px 20px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            text-decoration: none; 
            display: inline-block;
        }
        .btn-primary { 
            background: #667eea; 
            color: white; 
        }
        .btn-secondary { 
            background: #f8f9fa; 
            color: #333; 
        }
        .main-content { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }
        .welcome { 
            margin-bottom: 30px; 
        }
        .welcome h1 { 
            color: #333; 
            margin-bottom: 10px; 
        }
        .welcome p { 
            color: #666; 
            font-size: 18px; 
        }
        .features { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-top: 30px; 
        }
        .feature { 
            padding: 20px; 
            border: 1px solid #eee; 
            border-radius: 8px; 
        }
        .feature h3 { 
            color: #667eea; 
            margin-bottom: 10px; 
        }
        .loading { 
            display: none; 
            text-align: center; 
            padding: 20px; 
        }
        .spinner { 
            width: 40px; 
            height: 40px; 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #3498db; 
            border-radius: 50%; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 10px; 
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
        @media (max-width: 768px) {
            .nav { flex-direction: column; gap: 15px; }
            .nav-buttons { justify-content: center; }
            .features { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="nav">
                <div class="logo">💬 Chit Chat</div>
                <div class="nav-buttons">
                    <a href="#" class="btn btn-primary" onclick="showLogin()">Login</a>
                    <a href="#" class="btn btn-secondary" onclick="showRegister()">Register</a>
                </div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="welcome">
                <h1>Welcome to Chit Chat</h1>
                <p>Connect with people around the world and make new friends!</p>
            </div>
            
            <div class="features">
                <div class="feature">
                    <h3>🔐 Secure Authentication</h3>
                    <p>Safe and secure user registration and login system</p>
                </div>
                <div class="feature">
                    <h3>👥 Find Friends</h3>
                    <p>Discover and connect with random people worldwide</p>
                </div>
                <div class="feature">
                    <h3>💬 Real-time Chat</h3>
                    <p>Instant messaging with your friends and new connections</p>
                </div>
                <div class="feature">
                    <h3>📱 Mobile Friendly</h3>
                    <p>Works perfectly on all devices and screen sizes</p>
                </div>
            </div>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Loading application...</p>
            </div>
        </div>
    </div>

    <script>
        function showLogin() {
            document.getElementById('loading').style.display = 'block';
            setTimeout(() => {
                alert('Login functionality will be available when the full React app is built.\n\nFor now, this is a static version optimized for EC2 t2.micro.');
                document.getElementById('loading').style.display = 'none';
            }, 1000);
        }
        
        function showRegister() {
            document.getElementById('loading').style.display = 'block';
            setTimeout(() => {
                alert('Registration functionality will be available when the full React app is built.\n\nFor now, this is a static version optimized for EC2 t2.micro.');
                document.getElementById('loading').style.display = 'none';
            }, 1000);
        }
        
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Chit Chat Social App - Static Version Loaded');
            console.log('This is a memory-optimized version for EC2 t2.micro');
        });
    </script>
</body>
</html>
EOF

print_status "Step 2: Copy Public Assets"
echo "=============================="

# Copy public assets if they exist
if [ -d "public" ]; then
    print_status "Copying public assets..."
    cp -r public/* build/ 2>/dev/null || true
fi

# Create basic manifest
cat > build/manifest.json << 'EOF'
{
  "short_name": "Chit Chat",
  "name": "Chit Chat Social App",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
EOF

# Create robots.txt
cat > build/robots.txt << 'EOF'
User-agent: *
Allow: /
EOF

cd ..

print_status "Step 3: Verify Build"
echo "========================"

if [ -d "client/build" ] && [ -f "client/build/index.html" ]; then
    print_success "✅ Static build created successfully!"
    ls -la client/build/
    
    BUILD_SIZE=$(du -sh client/build | cut -f1)
    print_success "Build size: $BUILD_SIZE"
    
    print_success "Static HTML version created!"
    echo ""
    echo -e "${YELLOW}Note:${NC} This is a static HTML version that works without React build"
    echo -e "${YELLOW}It provides a functional UI but lacks full React functionality${NC}"
    echo ""
    echo -e "${BLUE}To access:${NC} http://your-ec2-ip"
else
    print_error "Build creation failed!"
    exit 1
fi

print_success "Manual build completed!"
echo "=============================="
echo -e "${GREEN}✅ Static HTML build completed${NC}"
echo -e "${BLUE}Build location: client/build/${NC}"
echo -e "${BLUE}Build size: $(du -sh client/build | cut -f1)${NC}"
echo ""
echo -e "${YELLOW}This static version:${NC}"
echo "✅ Works without npm install"
echo "✅ Uses minimal memory"
echo "✅ Provides functional UI"
echo "✅ Ready for Nginx serving"
echo ""
echo -e "${GREEN}Manual build completed! 🚀${NC}"
