#!/bin/bash
# Nova Ultra Launcher

echo "🚀 Starting Nova Ultra..."

# Check Node version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install it first."
    exit 1
fi

# Setup
if [ ! -f .env ]; then
    echo "⚙️  Running first-time setup..."
    node scripts/setup.js
fi

# Create dirs
mkdir -p data logs src/skills/generated

# Start
echo "🦾 Launching Nova Ultra..."
echo "══════════════════════════════════"
node src/index.js
