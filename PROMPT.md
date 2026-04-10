# Build Ollama Model Management WebApp

## Project Overview

Build a full-stack Ollama Model Management WebApp with FastAPI backend and React/Next.js 16 frontend. The application provides a web interface for managing Ollama models, Modelfiles, chat completions, and fine-tuning jobs.

## Technology Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, TypeScript
- **Backend**: FastAPI (Python), SQLAlchemy
- **Package Manager**: Bun

## Project Structure

```
/workspace/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py           # FastAPI application entry
│   │   └── routers/          # API routes (models, modelfiles, chat, finetune, system)
│   ├── models/
│   │   ├── database.py       # SQLAlchemy setup
│   │   └── schemas.py        # Pydantic schemas
│   ├── services/             # Business logic
│   ├── utils/                # Utilities
│   └── requirements.txt      # Python dependencies
├── src/                       # Next.js frontend
│   ├── app/                  # App Router pages
│   │   ├── page.tsx          # Dashboard (/)
│   │   ├── models/page.tsx   # Models management (/models)
│   │   ├── chat/page.tsx    # Chat playground (/chat)
│   │   ├── finetune/page.tsx # Fine-tuning jobs (/finetune)
│   │   ├── config/page.tsx  # Modelfile editor (/config)
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   └── components/
│       ├── Sidebar.tsx      # Navigation sidebar
│       └── ui/              # Reusable UI components
│           ├── Button.tsx
│           ├── Card.tsx
│           ├── Input.tsx
│           ├── Badge.tsx
│           ├── Slider.tsx
│           └── Loading.tsx
├── docker-compose.yml        # Docker orchestration
├── package.json              # Frontend dependencies
├── next.config.ts            # Next.js config
└── tsconfig.json            # TypeScript config
```

## Core Features

### 1. Dashboard (/)
- Display system statistics (total models, running models, system info)
- Show recent models list with status
- Quick actions for common tasks

### 2. Models Page (/models)
- List all installed Ollama models with details (name, size, modified date)
- Pull new models from Ollama registry
- Delete existing models
- View model details

### 3. Chat Page (/chat)
- Chat interface with message history
- Model selection dropdown
- Parameter controls:
  - Temperature slider (0-2)
  - Top-p slider (0-1)
  - Top-k slider (1-100)
  - Max tokens slider (1-4096)
  - Presence penalty slider (-2 to 2)
  - Frequency penalty slider (-2 to 2)
- Stream response toggle

### 4. Fine-tune Page (/finetune)
- List fine-tuning jobs with status
- Create new fine-tuning job:
  - Select base model
  - Upload training dataset (JSONL format)
  - Configure parameters (epochs, learning rate, batch size)
- View job logs and progress

### 5. Config Page (/config)
- List saved Modelfiles
- Create/Edit/Delete Modelfiles
- Syntax-highlighted YAML editor
- Template variables support

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/models` | GET | List all models |
| `/api/models/pull` | POST | Pull a new model |
| `/api/models/{name}` | DELETE | Delete a model |
| `/api/models/{name}` | GET | Get model details |
| `/api/modelfiles` | GET | List Modelfiles |
| `/api/modelfiles` | POST | Create Modelfile |
| `/api/modelfiles/{id}` | PUT | Update Modelfile |
| `/api/modelfiles/{id}` | DELETE | Delete Modelfile |
| `/api/chat/completions` | POST | Chat completion |
| `/api/finetune/jobs` | GET | List fine-tuning jobs |
| `/api/finetune/jobs` | POST | Create fine-tuning job |
| `/api/finetune/jobs/{id}` | GET | Get job status |
| `/api/finetune/jobs/{id}` | DELETE | Cancel job |
| `/api/system/stats` | GET | Get system statistics |

## UI/UX Requirements

### Layout
- Sidebar navigation (left side, collapsible)
- Main content area with responsive grid
- Header with page title and actions

### Styling (Tailwind CSS 4)
- Dark theme with slate/zinc color palette
- Consistent spacing (4px base unit)
- Border radius: 8px for cards, 6px for buttons
- Smooth transitions (150ms ease)

### Components
- Buttons: Primary (blue), Secondary (gray), Danger (red)
- Cards: Subtle border, shadow-sm, hover effect
- Inputs: Dark background, light border, focus ring
- Sliders: Custom styled with value display
- Loading states: Spinner with message
- Empty states: Icon + message + action

## Commands

### Frontend
```bash
bun install        # Install dependencies
bun dev            # Start dev server (http://localhost:3000)
bun build          # Production build
bun lint           # Run ESLint
bun typecheck      # TypeScript check
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker
```bash
docker-compose up
```

## Requirements

- Ensure all pages render correctly without errors
- All API endpoints return proper JSON responses
- Build passes successfully: `bun build`
- TypeScript passes: `bun typecheck`
- ESLint passes: `bun lint`