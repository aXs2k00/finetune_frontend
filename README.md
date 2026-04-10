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

### Option 1: Docker Compose (Recommended)

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