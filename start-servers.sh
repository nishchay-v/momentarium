#!/bin/bash

# Script to run frontend and backend simultaneously

echo "Starting Momentarium Frontend (port 3000) and Backend (port 3001)..."

# Start backend on port 3001
echo "Starting backend on port 3001..."
PORT=3001 npm run dev:backend &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend on port 3000
echo "Starting frontend on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo "Frontend PID: $FRONTEND_PID"
echo "Backend PID: $BACKEND_PID"
echo ""
echo "Frontend running at: http://localhost:3000"
echo "Backend API running at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup processes
cleanup() {
    echo "Stopping servers..."
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait