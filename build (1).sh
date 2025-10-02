#!/bin/bash

# Build script for Carrom Arena deployment
echo "🏗️ Starting Carrom Arena build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Type check
echo "🔍 Type checking..."
npm run type-check || {
    echo "❌ Type check failed!"
    exit 1
}

# Build the application
echo "🚀 Building application..."
npm run build || {
    echo "❌ Build failed!"
    exit 1
}

# Health check
echo "💊 Running health check..."
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ Build successful!"
    echo "Build ID: $(cat .next/BUILD_ID)"
else
    echo "❌ Build verification failed!"
    exit 1
fi

echo "🎉 Carrom Arena build completed successfully!"