#!/usr/bin/env bash

# Resolve project root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "🚦 Starting Adaptive Traffic Management System..."
echo "=================================================="

# Function to clean up child processes on exit
cleanup() {
  echo ""
  echo "🛑 Stopping all services..."
  # Kill all child process group / jobs
  kill $(jobs -p) 2>/dev/null || true
  wait 2>/dev/null || true
  echo "✅ All services stopped."
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start Spring Boot Backend
echo "📦 Starting Spring Boot Backend on http://localhost:8080..."
(cd "$PROJECT_DIR/backend" && ./mvnw spring-boot:run) &

# 2. Start Vite React Frontend
echo "💻 Starting Vite React Frontend on http://localhost:5173..."
(cd "$PROJECT_DIR/frontend" && npm run dev) &

echo ""
echo "✨ Services started in parallel:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend:  http://localhost:8080"
echo ""
echo "Press Ctrl+C to terminate both servers."
echo "=================================================="

# Wait for background processes
wait
