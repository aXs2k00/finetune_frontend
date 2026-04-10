from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List
import httpx
from ..models.schemas import ModelfileCreate, ModelfileResponse

router = APIRouter(prefix="/api/modelfiles", tags=["modelfiles"])

OLLAMA_BASE_URL = "http://localhost:11434"

modelfile_store: dict = {}


async def get_ollama_client():
    async with httpx.AsyncClient(base_url=OLLAMA_BASE_URL, timeout=120.0) as client:
        yield client


@router.get("", response_model=List[ModelfileResponse])
async def list_modelfiles():
    return [
        ModelfileResponse(
            id=data["id"],
            name=data["name"],
            content=data["content"],
            model_name=data.get("model_name"),
            parameters=data.get("parameters"),
            system_prompt=data.get("system_prompt"),
            template=data.get("template"),
            license=data.get("license"),
            created_at=data["created_at"],
            updated_at=data["updated_at"],
        )
        for data in modelfile_store.values()
    ]


@router.get("/{name}", response_model=ModelfileResponse)
async def get_modelfile(name: str):
    if name not in modelfile_store:
        raise HTTPException(status_code=404, detail="Modelfile not found")
    data = modelfile_store[name]
    return ModelfileResponse(
        id=data["id"],
        name=data["name"],
        content=data["content"],
        model_name=data.get("model_name"),
        parameters=data.get("parameters"),
        system_prompt=data.get("system_prompt"),
        template=data.get("template"),
        license=data.get("license"),
        created_at=data["created_at"],
        updated_at=data["updated_at"],
    )


@router.post("/create", response_model=ModelfileResponse)
async def create_modelfile(request: ModelfileCreate):
    if request.name in modelfile_store:
        raise HTTPException(status_code=400, detail="Modelfile already exists")
    
    import time
    now = time.time()
    modelfile_store[request.name] = {
        "id": len(modelfile_store) + 1,
        "name": request.name,
        "content": request.content,
        "model_name": request.model_name,
        "parameters": request.parameters,
        "system_prompt": request.system_prompt,
        "template": request.template,
        "license": request.license,
        "created_at": now,
        "updated_at": now,
    }
    data = modelfile_store[request.name]
    return ModelfileResponse(
        id=data["id"],
        name=data["name"],
        content=data["content"],
        model_name=data.get("model_name"),
        parameters=data.get("parameters"),
        system_prompt=data.get("system_prompt"),
        template=data.get("template"),
        license=data.get("license"),
        created_at=data["created_at"],
        updated_at=data["updated_at"],
    )


@router.put("/{name}", response_model=ModelfileResponse)
async def update_modelfile(name: str, request: ModelfileCreate):
    if name not in modelfile_store:
        raise HTTPException(status_code=404, detail="Modelfile not found")
    
    import time
    now = time.time()
    modelfile_store[name] = {
        "id": modelfile_store[name]["id"],
        "name": request.name,
        "content": request.content,
        "model_name": request.model_name,
        "parameters": request.parameters,
        "system_prompt": request.system_prompt,
        "template": request.template,
        "license": request.license,
        "created_at": modelfile_store[name]["created_at"],
        "updated_at": now,
    }
    data = modelfile_store[name]
    return ModelfileResponse(
        id=data["id"],
        name=data["name"],
        content=data["content"],
        model_name=data.get("model_name"),
        parameters=data.get("parameters"),
        system_prompt=data.get("system_prompt"),
        template=data.get("template"),
        license=data.get("license"),
        created_at=data["created_at"],
        updated_at=data["updated_at"],
    )


@router.post("/build")
async def build_modelfile(
    name: str,
    client: httpx.AsyncClient = Depends(get_ollama_client),
):
    if name not in modelfile_store:
        raise HTTPException(status_code=404, detail="Modelfile not found")
    
    modelfile = modelfile_store[name]
    model_name = modelfile.get("model_name", "llama2")
    
    try:
        response = await client.post(
            "/api/create",
            json={"name": name, "modelfile": modelfile["content"]},
        )
        response.raise_for_status()
        return {"status": "success", "model": name}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to build model: {str(e)}")