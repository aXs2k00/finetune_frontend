# Ollama Model Management WebApp

A full-stack web interface for managing Ollama models, Modelfiles, chat completions, and fine-tuning jobs.

## Features

- **Dashboard** - System statistics and recent models overview
- **Models** - Pull, list, and delete Ollama models
- **Chat** - Interactive chat playground with parameter controls
- **Fine-tune** - Create and manage fine-tuning jobs
- **Config** - Create and edit Modelfiles

## Prerequisites

- [Bun](https://bun.sh/) (for frontend)
- [Python 3.10+](https://www.python.org/) (for backend)
- [Docker & Docker Compose](https://www.docker.com/) (optional, for containerized setup)
- [Ollama](https://ollama.com/) running locally or accessible via network

## Quick Start

### Option 1: Automated Script (Recommended)

```bash
./start.sh
```

This script will:
1. Check Docker and Docker Compose are installed
2. Build and start all containers
3. Verify services are healthy

### Option 2: Docker Compose Manual

```bash
docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Ollama: http://localhost:11434

### Option 2: Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

Frontend will be available at http://localhost:3000

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | http://localhost:11434 | Ollama API URL |
| `DATABASE_URL` | sqlite:///./ollama_manager.db | Database connection |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | http://localhost:8000 | Backend API URL |

## Project Structure

```
.
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   └── routers/        # API endpoints
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   └── requirements.txt    # Python dependencies
├── src/                     # Next.js frontend
│   ├── app/                # App Router pages
│   │   ├── page.tsx        # Dashboard
│   │   ├── models/         # Models management
│   │   ├── chat/           # Chat playground
│   │   ├── finetune/      # Fine-tuning jobs
│   │   └── config/         # Modelfile editor
│   └── components/         # React components
├── docker-compose.yml      # Docker orchestration
└── package.json            # Frontend dependencies
```

## Pages Guide

### Dashboard (/)

Overview of your Ollama setup with:
- Total models count
- Running models
- System information (GPU, memory)
- Recent models list

### Models (/models)

Manage your Ollama models:
- **View**: See all installed models with size and modified date
- **Pull**: Download new models from Ollama library
- **Delete**: Remove unwanted models
- **Details**: View model information

### Chat (/chat)

Interactive chat interface:
- Select model from dropdown
- Adjust parameters:
  - Temperature (0-2)
  - Top-p (0-1)
  - Top-k (1-100)
  - Max tokens (1-4096)
  - Presence/Frequency penalty (-2 to 2)
- Toggle streaming responses
- Clear conversation history

### Fine-tune (/finetune)

Fine-tuning job management:
- View all jobs with status (pending, running, completed, failed)
- Create new job:
  - Select base model
  - Upload training data (JSONL format)
  - Set parameters (epochs, learning rate, batch size)
- View job logs and progress

### Config (/config)

Modelfile management:
- List saved Modelfiles
- Create new Modelfile with YAML editor
- Edit existing configurations
- Delete Modelfiles
- Support for template variables

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/models` | GET | List all models |
| `/api/models/pull` | POST | Pull a new model |
| `/api/models/{name}` | DELETE | Delete a model |
| `/api/models/{name}` | GET | Get model details |
| `/api/modelfiles` | GET, POST | List/Create Modelfiles |
| `/api/modelfiles/{id}` | PUT, DELETE | Update/Delete Modelfile |
| `/api/chat/completions` | POST | Chat completion |
| `/api/finetune/jobs` | GET, POST | List/Create jobs |
| `/api/finetune/jobs/{id}` | GET, DELETE | Get status/Cancel job |
| `/api/system/stats` | GET | System statistics |

Full API documentation available at `/docs` when backend is running.

## Development Commands

### Frontend

```bash
bun install        # Install dependencies
bun dev            # Start dev server
bun build          # Production build
bun lint           # Run ESLint
bun typecheck      # TypeScript check
```

### Backend

```bash
cd backend
uvicorn app.main:app --reload  # Development with hot reload
```

## Troubleshooting

### Ollama not connecting

Ensure Ollama is running:
```bash
ollama serve
```

Check environment variable `OLLAMA_BASE_URL` points to correct address.

### Docker GPU not detected

Ensure NVIDIA Docker runtime is installed:
```bash
docker run --rm --gpus all nvidia/cuda:11-base nvidia-smi
```

### Port already in use

Stop existing services or change ports in `docker-compose.yml`:
- Frontend: `3000`
- Backend: `8000`
- Ollama: `11434`

## License

MIT

---

## Setup Scripts

### Quick Start Script (Docker)

Save as `start.sh`:

```bash
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
```

Make executable and run:
```bash
chmod +x start.sh
./start.sh
```

### Manual Setup Script

Save as `setup-local.sh`:

```bash
#!/bin/bash
set -e

echo "Setting up Ollama Model Management WebApp (Manual)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} $1 found"
}

echo "Checking prerequisites..."
check_command bun
check_command python3
check_command pip

# Setup backend
echo ""
echo "Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Created virtual environment"
fi

source venv/bin/activate
pip install -r requirements.txt --quiet
echo "Backend dependencies installed"

# Go back to root
cd ..

# Setup frontend
echo ""
echo "Setting up frontend..."
bun install --silent
echo "Frontend dependencies installed"

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "To start the application:"
echo "  Backend:  cd backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "  Frontend: bun dev"
echo ""
echo "Or use the start script: ./start.sh"
```

Make executable and run:
```bash
chmod +x setup-local.sh
./setup-local.sh
```

### Stop Script

Save as `stop.sh`:

```bash
#!/bin/bash
echo "Stopping Ollama Model Management WebApp..."

# Docker Compose
if command -v docker-compose &> /dev/null; then
    docker-compose down
    echo "Docker containers stopped"
elif docker compose version &> /dev/null; then
    docker compose down
    echo "Docker containers stopped"
fi

# Kill manual processes if any
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

echo "All services stopped"
```

### Full Deployment Script

Save as `deploy.sh`:

```bash
#!/bin/bash
set -e

MODE=${1:-docker}  # docker, local, or production

echo "Deploying Ollama Model Management WebApp (mode: $MODE)..."

case $MODE in
    docker)
        echo "Using Docker Compose..."
        docker-compose up --build -d
        echo "Deployed! Access at http://localhost:3000"
        ;;
    local)
        echo "Running in development mode..."
        
        # Start backend
        cd backend
        source venv/bin/activate
        uvicorn app.main:app --host 0.0.0.0 --port 8000 &
        BACKEND_PID=$!
        cd ..
        
        # Start frontend
        bun dev &
        FRONTEND_PID=$!
        
        echo "Deployed! Access at http://localhost:3000"
        echo "Backend PID: $BACKEND_PID"
        echo "Frontend PID: $FRONTEND_PID"
        echo "Run 'kill $BACKEND_PID $FRONTEND_PID' to stop"
        ;;
    production)
        echo "Building for production..."
        bun build
        
        echo "Starting production server..."
        bun start &
        echo "Production server started at http://localhost:3000"
        ;;
    *)
        echo "Usage: $0 [docker|local|production]"
        exit 1
        ;;
esac
```