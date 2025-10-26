#!/bin/bash

# Momentarium Setup Script
# Helps set up the development environment

set -e

echo "🚀 Momentarium Setup Script"
echo "============================"
echo ""

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "⚠️  Warning: psql not found. You'll need PostgreSQL to run this application." >&2; }

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual credentials before proceeding."
    echo ""
    read -p "Press enter to continue after editing .env..."
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check database connection
echo ""
echo "🔍 Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
    if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
        echo "✅ Database connection successful"
        
        # Run migrations
        echo ""
        read -p "Run database migrations? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 Running migrations..."
            npm run db:migrate
            echo "✅ Migrations completed"
        fi
    else
        echo "⚠️  Could not connect to database. Please check your DATABASE_URL in .env"
    fi
else
    echo "⚠️  DATABASE_URL not set in environment"
fi

# Summary
echo ""
echo "============================"
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Ensure your .env file has all required credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "📚 See README.md for full documentation"


