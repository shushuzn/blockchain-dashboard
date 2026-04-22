#!/bin/bash
set -e

echo "========================================"
echo "  Blockchain Dashboard Deploy Script"
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "[1/5] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting."; exit 1; }

echo "[2/5] Checking environment..."
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    echo "Creating .env from .env.example..."
    cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
    echo "Please edit backend/.env and set your ENCRYPTION_KEY"
fi

echo "[3/5] Building Docker images..."
docker-compose build

echo "[4/5] Starting services..."
docker-compose up -d

echo "[5/5] Checking status..."
sleep 5
docker-compose ps

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API:      http://localhost:8000/api"
echo "Health:   http://localhost:8000/api/health"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:     docker-compose down"
echo ""
