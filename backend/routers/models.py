from fastapi import APIRouter, HTTPException, Depends
from typing import List
import httpx
from ..models.schemas import (
    OllamaModel,
    OllamaModelDetails,
    PullModelRequest,
)

router = APIRouter(prefix="/api/models", tags=["models"])

OLLAMA_BASE_URL = "http://localhost:11434"


async def get_ollama_client():
    async with httpx.AsyncClient(base_url=OLLAMA_BASE_URL, timeout=120.0) as client:
        yield client


@router.get("", response_model=List[OllamaModel])
async def list_models(client: httpx.AsyncClient = Depends(get_ollama_client)):
    try:
        response = await client.get("/api/tags")
        response.raise_for_status()
        data = response.json()
        return [
            OllamaModel(
                name=model.get("name", ""),
                size=model.get("size", 0),
                modified_at=model.get("modified_at"),
                digest=model.get("digest"),
            )
            for model in data.get("models", [])
        ]
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"Ollama not connected: {str(e)}")


@router.get("/{name}", response_model=OllamaModelDetails)
async def get_model_details(
    name: str, client: httpx.AsyncClient = Depends(get_ollama_client)
):
    try:
        response = await client.get(f"/api/show/{name}")
        response.raise_for_status()
        data = response.json()
        return OllamaModelDetails(
            modelfile=data.get("modelfile"),
            parameters=data.get("parameters"),
            template=data.get("template"),
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=404, detail=f"Model not found: {str(e)}")


@router.post("/pull")
async def pull_model(
    request: PullModelRequest, client: httpx.AsyncClient = Depends(get_ollama_client)
):
    try:
        response = await client.post(
            "/api/pull", json={"name": request.name}
        )
        response.raise_for_status()
        return {"status": "success", "model": request.name}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to pull model: {str(e)}")


@router.delete("/{name}")
async def delete_model(
    name: str, client: httpx.AsyncClient = Depends(get_ollama_client)
):
    try:
        response = await client.delete(f"/api/delete/{name}")
        response.raise_for_status()
        return {"status": "success", "model": name}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete model: {str(e)}")