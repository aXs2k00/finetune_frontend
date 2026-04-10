from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List
import json
from ..models.schemas import (
    OllamaModel,
    OllamaModelDetails,
    PullModelRequest,
    CompletionRequest,
)
from ..services.ollama import ollama_service

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("", response_model=List[OllamaModel])
async def list_models():
    try:
        models = await ollama_service.list_models()
        return [
            OllamaModel(
                name=model.get("name", ""),
                size=model.get("size", 0),
                modified_at=model.get("modified_at"),
                digest=model.get("digest"),
            )
            for model in models
        ]
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama not connected: {str(e)}")


@router.get("/{name}", response_model=OllamaModelDetails)
async def get_model_details(name: str):
    try:
        data = await ollama_service.get_model_details(name)
        return OllamaModelDetails(
            modelfile=data.get("modelfile"),
            parameters=data.get("parameters"),
            template=data.get("template"),
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Model not found: {str(e)}")


@router.post("/pull")
async def pull_model(request: PullModelRequest):
    async def event_generator():
        try:
            async for chunk in ollama_service.pull_model(request.name):
                yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.delete("/{name}")
async def delete_model(name: str):
    try:
        return await ollama_service.delete_model(name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete model: {str(e)}")


@router.post("/completion")
async def run_completion(request: CompletionRequest):
    async def event_generator():
        try:
            async for chunk in ollama_service.generate_completion(
                model=request.model,
                prompt=request.prompt,
                temperature=request.temperature,
                top_p=request.top_p,
                top_k=request.top_k,
                repeat_penalty=request.repeat_penalty,
                context_length=request.context_length,
                stop=request.stop,
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")