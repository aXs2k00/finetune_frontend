from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json

from ..services.metasploit import get_metasploit_client

router = APIRouter(prefix="/api/mission", tags=["mission"])

OLLAMA_BASE_URL = "http://localhost:11434"


class MissionRequest(BaseModel):
    objective: str
    target: str
    constraints: Optional[dict[str, str]] = None


class TaskStep(BaseModel):
    step: int
    phase: str
    description: str
    module: Optional[str] = None
    parameters: dict[str, str] = {}
    expected_result: Optional[str] = None
    safety_level: str = "medium"


class MissionPlan(BaseModel):
    mission_id: str
    objective: str
    target: str
    phases: List[TaskStep]
    estimated_duration: str
    risk_assessment: str


PROMPTS = {
    "recon": "You are a penetration testing planner. Analyze this objective and break it into specific reconnaissance tasks. Respond ONLY with valid JSON array of tasks with fields: phase, description, module (Metasploit module name if applicable), parameters (dict of options), expected_result.",
    "exploit": "You are an exploitation specialist. Break this objective into specific exploitation steps. Respond ONLY with valid JSON array of tasks with fields: phase, description, module, parameters, expected_result.",
    "post_exploit": "You are a post-exploitation expert. Break this objective into post-exploitation tasks. Respond ONLY with valid JSON array of tasks with fields: phase, description, module, parameters, expected_result.",
}


MISSION_TEMPLATES = {
    "basic_recon": [
        TaskStep(
            step=1,
            phase="recon",
            description="Perform TCP port scan",
            module="auxiliary/scanner/portscan/tcp",
            parameters={"PORTS": "1-1000", "THREADS": "10"},
            expected_result="Open ports list",
            safety_level="low",
        ),
        TaskStep(
            step=2,
            phase="recon",
            description="Service version detection",
            module="auxiliary/scanner/http/http_version",
            parameters={"THREADS": "10"},
            expected_result="Service versions",
            safety_level="low",
        ),
    ],
    "webassessment": [
        TaskStep(
            step=1,
            phase="recon",
            description="Web server fingerprinting",
            module="auxiliary/scanner/http/http_header",
            parameters={"THREADS": "10"},
            expected_result="HTTP headers",
            safety_level="low",
        ),
        TaskStep(
            step=2,
            phase="recon",
            description="Directory enumeration",
            module="auxiliary/scanner/http/dir_scanner",
            parameters={"PATH": "/", "THREADS": "10"},
            expected_result="Discovered paths",
            safety_level="low",
        ),
    ],
}


async def get_ollama_client():
    async with httpx.AsyncClient(base_url=OLLAMA_BASE_URL, timeout=120.0) as client:
        yield client


async def decompose_with_ollama(objective: str, target: str) -> MissionPlan:
    prompt = f"""{PROMPTS['exploit']}

Objective: {objective}
Target: {target}

Respond with JSON array only. Format:
[
  {{"step": 1, "phase": "recon", "description": "...", "module": "module/name", "parameters": {{"KEY": "VALUE"}}, "expected_result": "...", "safety_level": "low"}}
]"""
    
    async with httpx.AsyncClient(base_url=OLLAMA_BASE_URL, timeout=120.0) as client:
        try:
            response = await client.post(
                "/api/generate",
                json={
                    "model": "llama3:8b",
                    "prompt": prompt,
                    "stream": False,
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("response", "")
                
                try:
                    tasks = json.loads(content)
                    if isinstance(tasks, list):
                        phases = [TaskStep(**t) for t in tasks[:5]]
                        return MissionPlan(
                            mission_id=f"mission_{hash(objective)[:8]}",
                            objective=objective,
                            target=target,
                            phases=phases,
                            estimated_duration=f"{len(phases) * 10} minutes",
                            risk_assessment="medium",
                        )
                except json.JSONDecodeError:
                    pass
        except Exception as e:
            print(f"Ollama error: {e}")
    
    return MissionPlan(
        mission_id=f"mission_{hash(objective)[:8]}",
        objective=objective,
        target=target,
        phases=MISSION_TEMPLATES.get("basic_recon", []),
        estimated_duration="15 minutes",
        risk_assessment="medium",
    )


@router.post("/plan", response_model=MissionPlan)
async def create_mission_plan(request: MissionRequest):
    try:
        plan = await decompose_with_ollama(request.objective, request.target)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mission planning failed: {str(e)}")


@router.get("/templates")
async def list_templates():
    return {
        "templates": list(MISSION_TEMPLATES.keys()),
        "details": {
            name: {"phases": len(tmpl), "estimated_duration": f"{len(tmpl) * 10} minutes"}
            for name, tmpl in MISSION_TEMPLATES.items()
        },
    }


@router.get("/templates/{template_name}", response_model=MissionPlan)
async def get_template(template_name: str, objective: str = "Assessment", target: str = "target"):
    if template_name not in MISSION_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return MissionPlan(
        mission_id=f"template_{template_name}",
        objective=objective,
        target=target,
        phases=MISSION_TEMPLATES[template_name],
        estimated_duration=f"{len(MISSION_TEMPLATES[template_name]) * 10} minutes",
        risk_assessment="low",
    )


@router.get("/modules/by-phase/{phase}")
async def get_modules_for_phase(phase: str):
    client = await get_metasploit_client()
    
    modules_by_phase = {
        "recon": [
            "auxiliary/scanner/portscan/tcp",
            "auxiliary/scanner/http/http_version",
            "auxiliary/scanner/http/http_header",
            "auxiliary/scanner/smb/smb_version",
        ],
        "exploit": [
            "exploit/multi/http/apache_mod_cgi_bash_exec",
            "exploit/multi/http/jenkins_script_console",
            "exploit/windows/smb/ms17_010_eternalblue",
        ],
        "post_exploit": [
            "post/multi/manage/shell_to_meterpreter",
            "post/multi/manage/upload_exec",
            "post/linux/manage/download_exec",
        ],
    }
    
    return {
        "phase": phase,
        "modules": modules_by_phase.get(phase, []),
    }