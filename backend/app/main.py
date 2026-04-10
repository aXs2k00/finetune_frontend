from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Ollama Model Management API...")
    yield
    print("Shutting down...")


app = FastAPI(
    title="Ollama Model Management API",
    description="Web interface for managing and fine-tuning Ollama models",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from ..routers import models, modelfiles, chat, finetune, system, metasploit

app.include_router(models.router)
app.include_router(modelfiles.router)
app.include_router(chat.router)
app.include_router(finetune.router)
app.include_router(system.router)
app.include_router(metasploit.router)


@app.get("/")
async def root():
    return {
        "message": "Ollama Model Management API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    ollama_connected = False
    async with httpx.AsyncClient(base_url="http://localhost:11434", timeout=5.0) as client:
        try:
            response = await client.get("/api/tags")
            ollama_connected = response.status_code == 200
        except Exception:
            pass
    
    return {"status": "healthy", "ollama_connected": ollama_connected}