import os
from typing import Optional, Dict, Any, List
from pymetasploit3.msfrpc import MsfRpcClient


class MetasploitService:
    def __init__(self):
        self._client: Optional[MsfRpcClient] = None
        self._connected = False

    def _get_connection_params(self) -> Dict[str, Any]:
        return {
            "host": os.getenv("MSF_SERVER", "127.0.0.1"),
            "port": int(os.getenv("MSF_PORT", "55553")),
            "password": os.getenv("MSF_PASSWORD", ""),
            "ssl": os.getenv("MSF_SSL", "false").lower() == "true"
        }

    def connect(self) -> None:
        params = self._get_connection_params()
        self._client = MsfRpcClient(
            password=params["password"],
            host=params["host"],
            port=params["port"],
            ssl=params["ssl"]
        )
        self._connected = True

    def _ensure_connected(self) -> None:
        if not self._connected or self._client is None:
            self.connect()

    def list_exploits(self, search_query: str = "") -> List[Dict[str, Any]]:
        self._ensure_connected()
        try:
            if search_query:
                return self._client.modules.exploits(search_query)
            return self._client.modules.exploits()
        except Exception as e:
            return [{"error": str(e)}]

    def list_payloads(self, search_query: str = "", platform: str = "", arch: str = "") -> List[Dict[str, Any]]:
        self._ensure_connected()
        try:
            if search_query:
                return self._client.modules.payloads(search_query)
            return self._client.modules.payloads()
        except Exception as e:
            return [{"error": str(e)}]

    def list_auxiliary(self, search_query: str = "") -> List[Dict[str, Any]]:
        self._ensure_connected()
        try:
            if search_query:
                return self._client.modules.auxiliary(search_query)
            return self._client.modules.auxiliary()
        except Exception as e:
            return [{"error": str(e)}]

    def list_post(self, search_query: str = "") -> List[Dict[str, Any]]:
        self._ensure_connected()
        try:
            if search_query:
                return self._client.modules.post(search_query)
            return self._client.modules.post()
        except Exception as e:
            return [{"error": str(e)}]

    def run_exploit(self, module_name: str, target_options: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_connected()
        try:
            exploit = self._client.modules.use("exploit", module_name)
            for key, value in target_options.items():
                exploit[key] = value
            result = exploit.execute(payload="generic/shell_bind_tcp")
            return {"result": result}
        except Exception as e:
            return {"error": str(e)}

    def run_auxiliary(self, module_name: str, options: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_connected()
        try:
            aux = self._client.modules.use("auxiliary", module_name)
            for key, value in options.items():
                aux[key] = value
            result = aux.execute()
            return {"result": result}
        except Exception as e:
            return {"error": str(e)}

    def run_post(self, module_name: str, options: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_connected()
        try:
            post = self._client.modules.use("post", module_name)
            for key, value in options.items():
                post[key] = value
            result = post.execute()
            return {"result": result}
        except Exception as e:
            return {"error": str(e)}

    def get_session(self, session_id: int) -> Dict[str, Any]:
        self._ensure_connected()
        try:
            return self._client.sessions.session(session_id)
        except Exception as e:
            return {"error": str(e)}

    def list_sessions(self) -> List[Dict[str, Any]]:
        self._ensure_connected()
        try:
            sessions = self._client.sessions.list
            return [{"id": sid, "info": info} for sid, info in sessions.items()]
        except Exception as e:
            return [{"error": str(e)}]


metasploit_service = MetasploitService()