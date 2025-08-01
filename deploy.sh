#!/bin/bash

# SecureServe Platform Deployment Script
echo "🚀 Starting SecureServe Platform Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type check
echo "🔍 Running TypeScript type check..."
npm run type-check

# Lint code
echo "🧹 Running ESLint..."
npm run lint

# Build the project
echo "🏗️ Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output is in the 'dist' directory"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Upload the 'dist' directory to your hosting provider"
    echo "2. Configure your domain to point to the hosting service"
    echo "3. Set up environment variables on your hosting platform"
    echo ""
    echo "🌐 Deployment-ready files are in the 'dist' directory"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi 