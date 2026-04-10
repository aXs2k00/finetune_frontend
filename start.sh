#!/bin/bash

# Kill any existing processes on required ports
fuser -k 11434/tcp 2>/dev/null
fuser -k 8000/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null

# Start Redis (required for Celery)
redis-server --daemonize yes

# Start FastAPI Backend
cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &

# Start Next.js Frontend
bun run dev &