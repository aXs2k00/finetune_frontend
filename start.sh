#!/bin/bash
set -e

echo "Starting Ollama Model Management WebApp..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose not installed"
    exit 1
fi

# Start services
echo "Building and starting containers..."
docker-compose up --build -d

# Wait for services
echo "Waiting for services to be ready..."
sleep 5

# Check health
echo "Checking service health..."
curl -s http://localhost:8000/health || echo "Backend not ready yet"
curl -s http://localhost:11434/api/tags || echo "Ollama not ready yet"

echo ""
echo "Services started successfully!"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo "  Ollama:    http://localhost:11434"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:     docker-compose down"
