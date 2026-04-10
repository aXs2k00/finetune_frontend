from fastapi import APIRouter, Depends
import platform
import httpx
from ..models.schemas import SystemStats

router = APIRouter(prefix="/api/system", tags=["system"])

OLLAMA_BASE_URL = "http://localhost:11434"


async def get_ollama_client():
    async with httpx.AsyncClient(base_url=OLLAMA_BASE_URL, timeout=10.0) as client:
        yield client


@router.get("/stats", response_model=SystemStats)
async def get_system_stats(client: httpx.AsyncClient = Depends(get_ollama_client)):
    ollama_connected = False
    gpu_info = None
    
    try:
        response = await client.get("/api/tags")
        if response.status_code == 200:
            ollama_connected = True
    except Exception:
        pass
    
    import psutil
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        memory_total = memory.total
        memory_used = memory.used
    except Exception:
        cpu_percent = None
        memory_total = None
        memory_used = None
    
    return SystemStats(
        ollama_connected=ollama_connected,
        cpu_percent=cpu_percent,
        memory_total=memory_total,
        memory_used=memory_used,
        gpu_available=False,
        gpu_info=gpu_info,
    )