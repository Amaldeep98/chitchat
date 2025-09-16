#!/bin/bash

# Sync Environment Files Script
# This script copies env.example files to .env files

echo "🔄 Syncing environment files from examples..."
echo "=============================================="

# Copy server environment
if [ -f "server/env.example" ]; then
    cp server/env.example server/.env
    echo "✅ Server .env updated from env.example"
else
    echo "❌ server/env.example not found"
fi

# Copy client environment
if [ -f "client/env.example" ]; then
    cp client/env.example client/.env
    echo "✅ Client .env updated from env.example"
else
    echo "❌ client/env.example not found"
fi

echo ""
echo "🎉 Environment files synced successfully!"
echo ""
echo "Current configuration:"
echo "======================="
echo "Server:"
cat server/.env | grep -E "(PORT|HOST|SERVER_URL|CLIENT_URL)" | head -4
echo ""
echo "Client:"
cat client/.env | grep -E "REACT_APP_" | head -3
