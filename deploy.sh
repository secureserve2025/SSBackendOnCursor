#!/bin/bash

echo "🚀 SecureServe Platform - Deployment Script"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "⚠️  Warning: VITE_SUPABASE_URL not set"
else
    echo "✅ VITE_SUPABASE_URL is set"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Warning: VITE_SUPABASE_ANON_KEY not set"
else
    echo "✅ VITE_SUPABASE_ANON_KEY is set"
fi

if [ -z "$VITE_OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: VITE_OPENAI_API_KEY not set"
else
    echo "✅ VITE_OPENAI_API_KEY is set"
fi

# Type check
echo "🔍 Running TypeScript type check..."
npm run type-check

# Lint
echo "🔍 Running ESLint..."
npm run lint

# Build
echo "🏗️  Building for production..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build successful! dist/ directory created."
    echo "📁 Build contents:"
    ls -la dist/
else
    echo "❌ Build failed! dist/ directory not found."
    exit 1
fi

# Test the build locally
echo "🧪 Testing build locally..."
npm run preview &
PREVIEW_PID=$!

# Wait a moment for the server to start
sleep 3

# Test basic routes
echo "🔍 Testing routes..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/ | grep -q "200" && echo "✅ Homepage accessible" || echo "❌ Homepage not accessible"
curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/login/freelancer | grep -q "200" && echo "✅ Freelancer login accessible" || echo "❌ Freelancer login not accessible"
curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/manifest.json | grep -q "200" && echo "✅ Manifest accessible" || echo "❌ Manifest not accessible"

# Kill the preview server
kill $PREVIEW_PID

echo ""
echo "🎉 Deployment verification complete!"
echo "📋 Next steps:"
echo "1. Commit and push your changes to GitHub"
echo "2. Deploy to Vercel: vercel --prod"
echo "3. Set environment variables in Vercel dashboard"
echo "4. Test the deployed application" 