from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Optional
from pydantic import BaseModel
import asyncio
import json

from ..services.metasploit import (
    get_metasploit_client,
    ensure_connected,
    MetasploitSession,
    MetasploitModule,
    MetasploitResult,
)

router = APIRouter(prefix="/api/msf", tags=["metasploit"])


class SessionResponse(BaseModel):
    id: int
    type: str
    target: str
    exploit: str
    payload: str
    launched_at: float
    last_seen: float


class ModuleSearchRequest(BaseModel):
    query: str
    mtype: str = "exploit"


class ModuleRunRequest(BaseModel):
    module: str
    target: str
    options: dict[str, str] = {}


class SessionInteractRequest(BaseModel):
    session_id: int
    command: str


class MissionRequest(BaseModel):
    objective: str
    target: str


class TaskStep(BaseModel):
    step: str
    description: str
    module: Optional[str] = None
    parameters: dict[str, str] = {}


class MissionPlan(BaseModel):
    objective: str
    target: str
    estimated_duration: str
    tasks: List[TaskStep]


active_connections: List[WebSocket] = []


async def broadcast_feed(message: dict):
    for ws in active_connections:
        try:
            await ws.send_json(message)
        except Exception:
            pass


@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions():
    connected = await ensure_connected()
    if not connected:
        raise HTTPException(status_code=503, detail="Metasploit not connected")
    
    client = await get_metasploit_client()
    sessions = await client.list_sessions()
    
    return [
        SessionResponse(
            id=s.id,
            type=s.type,
            target=s.target,
            exploit=s.exploit,
            payload=s.payload,
            launched_at=s.launched_at,
            last_seen=s.last_seen or s.launched_at,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
async def get_session(session_id: int):
    connected = await ensure_connected()
    if not connected:
        raise HTTPException(status_code=503, detail="Metasploit not connected")
    
    client = await get_metasploit_client()
    sessions = await client.list_sessions()
    
    for s in sessions:
        if s.id == session_id:
            return SessionResponse(
                id=s.id,
                type=s.type,
                target=s.target,
                exploit=s.exploit,
                payload=s.payload,
                launched_at=s.launched_at,
                last_seen=s.last_seen or s.launched_at,
            )
    
    raise HTTPException(status_code=404, detail="Session not found")


@router.post("/sessions/{session_id}/interact")
async def interact_session(session_id: int, request: SessionInteractRequest):
    connected = await ensure_connected()
    if not connected:
        raise HTTPException(status_code=503, detail="Metasploit not connected")
    
    client = await get_metasploit_client()
    result = await client.interact_session(session_id)
    
    await broadcast_feed({
        "type": "session_interact",
        "session_id": session_id,
        "command": request.command,
        "timestamp": asyncio.get_event_loop().time(),
    })
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    return {"status": "success", "message": result.message}


@router.delete("/sessions/{session_id}")
async def kill_session(session_id: int):
    connected = await ensure_connected()
    if not connected:
        raise HTTPException(status_code=503, detail="Metasploit not connected")
    
    client = await get_metasploit_client()
    result = await client.kill_session(session_id)
    
    await broadcast_feed({
        "type": "session_killed",
        "session_id": session_id,
        "timestamp": asyncio.get_event_loop().time(),
    })
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    return {"status": "success", "message": result.message}


@router.get("/modules")
async def list_modules(mtype: str = "exploit"):
    connected = await ensure_connected()
    if not connected:
        raise HTTPException(status_code=503, detail="Metasploit not connected")
    
    client = await get_metasploit_client()
    modules = await client.list_modules(mtype)
    
    return [
        {
            "name": m.name,
            "full_name": m.full_name,
            "type": m.mtype,
            "arch": m.arch,
            "platform": m.platform,
            "description": m.description,
        }
        for m in modules
    ]


@router.get("/modules/search")
async def search_modules(query: str, mtype: str = "exploit"):
    connected = await ensure_connected()
    if not connected:
        raise HTTPException(status_code=503, detail="Metasploit not connected")
    
    client = await get_metasploit_client()
    all_modules = await client.list_modules(mtype)
    
    filtered = [
        m for m in all_modules
        if query.lower() in m.name.lower() or query.lower() in m.description.lower()
    ]
    
    return [
        {
            "name": m.name,
            "full_name": m.full_name,
            "type": m.mtype,
            "description": m.description,
        }
        for m in filtered[:20]
    ]


@router.post("/modules/run")
async def run_module(request: ModuleRunRequest):
    connected = await ensure_connected()
    if not connected:
        raise HTTPException(status_code=503, detail="Metasploit not connected")
    
    client = await get_metasploit_client()
    
    await broadcast_feed({
        "type": "module_start",
        "module": request.module,
        "target": request.target,
        "timestamp": asyncio.get_event_loop().time(),
    })
    
    result = await client.run_module(request.target, {**request.options, "module": request.module})
    
    await broadcast_feed({
        "type": "module_complete",
        "module": request.module,
        "target": request.target,
        "success": result.success,
        "message": result.message,
        "timestamp": asyncio.get_event_loop().time(),
    })
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)
    
    return {"status": "success", "message": result.message, "data": result.data}


@router.get("/status")
async def get_status():
    client = await get_metasploit_client()
    return {
        "connected": client.connected,
        "host": client.host,
        "port": client.port,
    }


@router.post("/connect")
async def connect():
    client = await get_metasploit_client()
    if not client.connected:
        result = await client.connect()
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
    
    return {"status": "success", "message": "Connected to Metasploit"}


@router.post("/disconnect")
async def disconnect():
    client = await get_metasploit_client()
    await client.disconnect()
    return {"status": "success", "message": "Disconnected from Metasploit"}


@router.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    
    await websocket.send_json({
        "type": "connected",
        "message": "WebSocket feed connected",
    })
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get("type") == "command":
                    client = await get_metasploit_client()
                    if client.connected:
                        result = await client.execute(message.get("command", ""))
                        await websocket.send_json({
                            "type": "command_result",
                            "result": result,
                        })
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)