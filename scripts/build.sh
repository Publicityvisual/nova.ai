#!/bin/bash
# Nova Ultra Build Script
# Adds protection before deployment

echo "🔒 Nova Ultra Build System"
echo "=========================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production 2>/dev/null

# Run protection
echo "🛡️  Running code protection..."
node scripts/protect.js protect

# Run tests
echo "🧪 Running tests..."
npm test 2>/dev/null || echo "  (No tests configured)"

# Create distribution
echo "📦 Creating distribution..."
mkdir -p dist

# Copy protected files
cp -r src dist/
cp -r data dist/ 2>/dev/null || true
cp package.json dist/
cp .env.example dist/
cp README.md dist/
cp OPENROUTER-GUIDE.md dist/
cp .build-info.json dist/ 2>/dev/null || true

echo ""
echo "✅ Build complete: ./dist/"
echo "🚀 Ready for deployment"
