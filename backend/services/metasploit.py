import asyncio
import json
from typing import Any, AsyncIterator, Optional
from dataclasses import dataclass, field


@dataclass
class MetasploitSession:
    id: int
    type: str
    target: str
    exploit: str
    payload: str
    launched_at: float
    last_seen: float = 0


@dataclass
class MetasploitModule:
    name: str
    full_name: str
    mtype: str
    arch: list[str]
    platform: list[str]
    description: str
    author: list[str]
    references: list[dict[str, str]]


@dataclass
class MetasploitResult:
    success: bool
    message: str
    data: Optional[dict[str, Any]] = None


class MetasploitClient:
    def __init__(self, host: str = "localhost", port: int = 55553, password: str = "meterpreter"):
        self.host = host
        self.port = port
        self.password = password
        self.process: Optional[asyncio.subprocess.Process] = None
        self.input_queue: asyncio.Queue = asyncio.Queue()
        self.connected = False
        self.sessions: dict[int, MetasploitSession] = {}
        self._reader_task: Optional[asyncio.Task] = None

    async def connect(self) -> MetasploitResult:
        try:
            self.process = await asyncio.create_subprocess_exec(
                "msfconsole",
                "-r", "-",
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            self._reader_task = asyncio.create_task(self._read_output())
            await asyncio.sleep(1)
            self.connected = True
            return MetasploitResult(success=True, message="Connected to Metasploit")
        except FileNotFoundError:
            return MetasploitResult(success=False, message="Metasploit not found. Install msfconsole.")
        except Exception as e:
            return MetasploitResult(success=False, message=f"Connection failed: {str(e)}")

    async def disconnect(self):
        if self.process:
            self.process.terminate()
            await self.process.wait()
        if self._reader_task:
            self._reader_task.cancel()
        self.connected = False

    async def _read_output(self):
        if not self.process or not self.process.stdout:
            return
        while self.connected:
            try:
                line = await asyncio.wait_for(self.process.stdout.readline(), timeout=1.0)
                if not line:
                    break
                yield line.decode()
            except asyncio.TimeoutError:
                continue

    async def execute(self, command: str) -> dict[str, Any]:
        if not self.process or not self.process.stdin:
            return {"success": False, "error": "Not connected"}
        
        self.process.stdin.write(f"{command}\n".encode())
        await self.process.stdin.drain()
        await asyncio.sleep(0.5)
        
        output_lines = []
        if self.process.stdout:
            while True:
                try:
                    line = await asyncio.wait_for(self.process.stdout.readline(), timeout=0.1)
                    if not line:
                        break
                    output_lines.append(line.decode().strip())
                except asyncio.TimeoutError:
                    break
        
        return {
            "success": True,
            "output": "\n".join(output_lines),
            "raw": output_lines
        }

    async def list_sessions(self) -> list[MetasploitSession]:
        result = await self.execute("sessions -l")
        sessions = []
        if result.get("success"):
            for line in result.get("raw", []):
                if line.strip().isdigit():
                    sid = int(line.strip())
                    if sid in self.sessions:
                        sessions.append(self.sessions[sid])
        return sessions

    async def list_modules(self, mtype: str = "exploit") -> list[MetasploitModule]:
        result = await self.execute(f"search {mtype}")
        modules = []
        if result.get("success"):
            for line in result.get("raw", []):
                if "/" in line and mtype in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        modules.append(MetasploitModule(
                            name=parts[0],
                            full_name=parts[0],
                            mtype=mtype,
                            arch=[],
                            platform=[],
                            description=" ".join(parts[1:]) if len(parts) > 1 else "",
                            author=[],
                            references=[]
                        ))
        return modules[:50]

    async def use_module(self, module_name: str) -> MetasploitResult:
        result = await self.execute(f"use {module_name}")
        return MetasploitResult(
            success=result.get("success", False),
            message=f"Using {module_name}" if result.get("success") else "Failed"
        )

    async def set_module_option(self, option: str, value: str) -> MetasploitResult:
        result = await self.execute(f"set {option} {value}")
        return MetasploitResult(
            success=result.get("success", False),
            message=f"{option} set to {value}"
        )

    async def run_module(self, target: str, opts: dict[str, str]) -> MetasploitResult:
        module_name = opts.get("module", "")
        if not module_name:
            return MetasploitResult(success=False, message="No module specified")
        
        await self.use_module(module_name)
        
        for option, value in opts.items():
            if option != "module":
                await self.set_module_option(option, value)
        
        await self.set_module_option("RHOSTS", target)
        result = await self.execute("run")
        
        return MetasploitResult(
            success=result.get("success", False),
            message="Module executed",
            data={"output": result}
        )

    async def interact_session(self, session_id: int) -> MetasploitResult:
        result = await self.execute(f"sessions -i {session_id}")
        return MetasploitResult(
            success=result.get("success", False),
            message=f"Interacting with session {session_id}"
        )

    async def kill_session(self, session_id: int) -> MetasploitResult:
        result = await self.execute(f"sessions -k {session_id}")
        if session_id in self.sessions:
            del self.sessions[session_id]
        return MetasploitResult(
            success=result.get("success", False),
            message=f"Session {session_id} killed"
        )


_client: Optional[MetasploitClient] = None


async def get_metasploit_client() -> MetasploitClient:
    global _client
    if _client is None:
        _client = MetasploitClient()
    return _client


async def ensure_connected() -> bool:
    client = await get_metasploit_client()
    if not client.connected:
        await client.connect()
    return client.connected