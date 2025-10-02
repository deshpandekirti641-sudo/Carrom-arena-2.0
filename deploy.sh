#!/usr/bin/env bash

# Carrom Arena Deployment Script
# This script ensures all dependencies are available and builds correctly

set -e  # Exit on any error

echo "🚀 Starting Carrom Arena Deployment..."

# Check Node.js version
echo "📋 Checking Node.js version..."
node --version
npm --version

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Type check
echo "🔍 Running type check..."
npm run type-check

# Build the application
echo "🏗️  Building application..."
npm run build

# Test the build
echo "✅ Build completed successfully!"
echo "🎯 Carrom Arena is ready for deployment!"

# Display build stats
if [ -d ".next" ]; then
    echo "📊 Build Output:"
    ls -la .next/
    echo ""
    echo "📁 Static Files:"
    du -sh .next/static/ 2>/dev/null || echo "No static files generated"
fi

echo "🎉 Deployment preparation completed!"