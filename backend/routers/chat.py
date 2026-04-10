from fastapi import APIRouter, HTTPException, Depends
from typing import List
import httpx
from ..models.schemas import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ConversationCreate,
    ConversationResponse,
    ChatMessage,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])

OLLAMA_BASE_URL = "http://localhost:11434"

conversation_store: dict = {}


async def get_ollama_client():
    async with httpx.AsyncClient(base_url=OLLAMA_BASE_URL, timeout=300.0) as client:
        yield client


@router.post("/completions", response_model=ChatCompletionResponse)
async def chat_completions(
    request: ChatCompletionRequest,
    client: httpx.AsyncClient = Depends(get_ollama_client),
):
    try:
        payload = {
            "model": request.model,
            "messages": [msg.model_dump() for msg in request.messages],
            "stream": request.stream,
            "options": {
                "temperature": request.temperature,
                "top_p": request.top_p,
                "top_k": request.top_k,
                "repeat_penalty": request.repeat_penalty,
                "num_ctx": request.context_length,
            },
        }
        response = await client.post("/api/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        return ChatCompletionResponse(
            model=data.get("model", request.model),
            message=ChatMessage(
                role=data.get("message", {}).get("role", "assistant"),
                content=data.get("message", {}).get("content", ""),
            ),
            done=data.get("done", True),
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Chat failed: {str(e)}")


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations():
    return [
        ConversationResponse(
            id=data["id"],
            model_name=data["model_name"],
            messages=data["messages"],
            title=data.get("title"),
            created_at=data["created_at"],
        )
        for data in conversation_store.values()
    ]


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(request: ConversationCreate):
    import time
    now = time.time()
    conv_id = len(conversation_store) + 1
    conversation_store[str(conv_id)] = {
        "id": conv_id,
        "model_name": request.model_name,
        "messages": [msg.model_dump() for msg in request.messages],
        "title": request.title or f"Conversation {conv_id}",
        "created_at": now,
    }
    data = conversation_store[str(conv_id)]
    return ConversationResponse(
        id=data["id"],
        model_name=data["model_name"],
        messages=data["messages"],
        title=data.get("title"),
        created_at=data["created_at"],
    )


@router.get("/conversations/{conv_id}", response_model=ConversationResponse)
async def get_conversation(conv_id: int):
    key = str(conv_id)
    if key not in conversation_store:
        raise HTTPException(status_code=404, detail="Conversation not found")
    data = conversation_store[key]
    return ConversationResponse(
        id=data["id"],
        model_name=data["model_name"],
        messages=data["messages"],
        title=data.get("title"),
        created_at=data["created_at"],
    )


@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: int):
    key = str(conv_id)
    if key not in conversation_store:
        raise HTTPException(status_code=404, detail="Conversation not found")
    del conversation_store[key]
    return {"status": "success", "message": "Conversation deleted"}