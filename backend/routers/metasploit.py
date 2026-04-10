from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import subprocess
import json
import re

router = APIRouter(prefix="/api/msf", tags=["metasploit"])


class ExploitRequest(BaseModel):
    module: str
    target: Optional[str] = None
    payload: Optional[str] = None
    options: Optional[dict] = {}


class AuxiliaryRequest(BaseModel):
    module: str
    target: Optional[str] = None
    options: Optional[dict] = {}


class ModuleInfo(BaseModel):
    name: str
    full_name: str
    disclosure_date: Optional[str] = None
    rank: Optional[str] = None
    description: str
    references: List[str] = []


class ExploitResult(BaseModel):
    success: bool
    message: str
    session_id: Optional[int] = None
    output: str


async def run_msf_command(command: str, timeout: int = 60) -> str:
    try:
        result = subprocess.run(
            ["msfconsole", "-x", command, "-q"],
            capture_output=True,
            text=True,
            timeout=timeout,
            env={"MSF_MULTI_THREAD": "true"},
        )
        return result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Metasploit command timed out")
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Metasploit not installed")


def parse_module_list(output: str) -> List[ModuleInfo]:
    modules = []
    lines = output.strip().split("\n")
    for line in lines:
        if line.strip() and not line.startswith("["):
            parts = line.split()
            if len(parts) >= 2:
                modules.append(
                    ModuleInfo(
                        name=parts[0],
                        full_name=" ".join(parts[1:]) if len(parts) > 1 else "",
                        description="",
                    )
                )
    return modules


@router.get("/search/exploits", response_model=List[ModuleInfo])
async def search_exploits(query: str = "", rank: Optional[str] = None):
    search_query = query
    if rank:
        search_query += f" rank:{rank}"
    
    cmd = f"search {search_query} type:exploit"
    output = await run_msf_command(cmd)
    
    modules = []
    in_module = False
    for line in output.split("\n"):
        if "#" in line:
            in_module = True
            continue
        if in_module and line.strip():
            parts = line.split()
            if len(parts) >= 2:
                mod = parts[0]
                if "/" in mod:
                    modules.append(
                        ModuleInfo(
                            name=mod.split("/")[-1],
                            full_name=mod,
                            description=line[len(mod) + 1 :] if len(line) > len(mod) else "",
                        )
                    )
    
    return modules[:50]


@router.get("/search/payloads", response_model=List[ModuleInfo])
async def search_payloads(query: str = ""):
    cmd = f"search {query} type:payload"
    output = await run_msf_command(cmd)
    
    modules = []
    for line in output.split("\n"):
        if line.strip() and not line.startswith("["):
            parts = line.split()
            if len(parts) >= 2 and "/" in parts[0]:
                modules.append(
                    ModuleInfo(
                        name=parts[0].split("/")[-1],
                        full_name=parts[0],
                        description=parts[1] if len(parts) > 1 else "",
                    )
                )
    
    return modules[:50]


@router.post("/exploit", response_model=ExploitResult)
async def run_exploit(request: ExploitRequest):
    options = request.options or {}
    options_str = " ".join([f"{k}={v}" for k, v in options.items()])
    
    cmd = f"use exploit/{request.module}; set RHOSTS {request.target}; set PAYLOAD {request.payload or 'generic/shell_bind_tcp'}; set {options_str}; exploit"
    output = await run_msf_command(cmd, timeout=120)
    
    session_id = None
    session_match = re.search(r"Session (\d+) created", output)
    if session_match:
        session_id = int(session_match.group(1))
    
    success = "Session" in output or "meterpreter" in output.lower() or "shell" in output.lower()
    
    return ExploitResult(
        success=success,
        message="Exploit completed" if success else "Exploit failed",
        session_id=session_id,
        output=output[-2000:],
    )


@router.post("/auxiliary", response_model=ExploitResult)
async def run_auxiliary(request: AuxiliaryRequest):
    options = request.options or {}
    options_str = " ".join([f"{k}={v}" for k, v in options.items()])
    
    cmd = f"use auxiliary/{request.module}; set RHOSTS {request.target}; set {options_str}; run"
    output = await run_msf_command(cmd, timeout=120)
    
    success = "[+]" in output or "completed" in output.lower()
    
    return ExploitResult(
        success=success,
        message="Auxiliary module completed" if success else "Auxiliary module failed",
        output=output[-2000:],
    )


@router.get("/modules/info/{module_type}/{module_name}", response_model=ModuleInfo)
async def get_module_info(module_type: str, module_name: str):
    cmd = f"info {module_type}/{module_name}"
    output = await run_msf_command(cmd)
    
    name = module_name
    description = ""
    references = []
    disclosure_date = None
    rank = None
    
    for line in output.split("\n"):
        if "Name:" in line:
            name = line.split("Name:")[-1].strip()
        if "Description:" in line:
            description = line.split("Description:")[-1].strip()
        if "Disclosure date:" in line:
            disclosure_date = line.split("Disclosure date:")[-1].strip()
        if "Rank:" in line:
            rank = line.split("Rank:")[-1].strip()
        if "Reference:" in line:
            ref = line.strip()
            if ref:
                references.append(ref)
    
    return ModuleInfo(
        name=name,
        full_name=f"{module_type}/{module_name}",
        disclosure_date=disclosure_date,
        rank=rank,
        description=description,
        references=references,
    )


@router.get("/sessions")
async def list_sessions():
    cmd = "sessions -l"
    output = await run_msf_command(cmd)
    
    sessions = []
    for line in output.split("\n"):
        if re.match(r"\s*\d+\s+", line):
            parts = line.split()
            if len(parts) >= 4:
                sessions.append({
                    "id": int(parts[0]),
                    "type": parts[1],
                    "name": parts[2],
                    "target": parts[3] if len(parts) > 3 else "",
                })
    
    return {"sessions": sessions, "output": output}


@router.post("/sessions/{session_id}/kill")
async def kill_session(session_id: int):
    cmd = f"sessions -k {session_id}"
    output = await run_msf_command(cmd)
    
    return {"success": True, "session_id": session_id, "output": output}