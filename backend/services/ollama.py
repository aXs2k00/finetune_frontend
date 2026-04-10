import httpx
from typing import AsyncGenerator, Optional
import json


class OllamaService:
    def __init__(self, base_url: str = "http://localhost:11434", timeout: float = 300.0):
        self.base_url = base_url
        self.timeout = timeout

    async def list_models(self) -> list[dict]:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
            response = await client.get("/api/tags")
            response.raise_for_status()
            data = response.json()
            return data.get("models", [])

    async def get_model_details(self, name: str) -> dict:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
            response = await client.get(f"/api/show/{name}")
            response.raise_for_status()
            return response.json()

    async def pull_model(self, name: str) -> AsyncGenerator[dict, None]:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=600.0) as client:
            async with client.stream("POST", "/api/pull", json={"name": name}) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            yield json.loads(line)
                        except json.JSONDecodeError:
                            continue

    async def delete_model(self, name: str) -> dict:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
            response = await client.delete(f"/api/delete/{name}")
            response.raise_for_status()
            return {"status": "success", "model": name}

    async def generate_completion(
        self,
        model: str,
        prompt: str,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        repeat_penalty: Optional[float] = None,
        context_length: Optional[int] = None,
        stop: Optional[list[str]] = None,
    ) -> AsyncGenerator[dict, None]:
        options = {}
        if temperature is not None:
            options["temperature"] = temperature
        if top_p is not None:
            options["top_p"] = top_p
        if top_k is not None:
            options["top_k"] = top_k
        if repeat_penalty is not None:
            options["repeat_penalty"] = repeat_penalty
        if context_length is not None:
            options["num_ctx"] = context_length
        if stop is not None:
            options["stop"] = stop

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": True,
            "options": options,
        }

        async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
            async with client.stream("POST", "/api/generate", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            yield json.loads(line)
                        except json.JSONDecodeError:
                            continue

    async def chat_completion(
        self,
        model: str,
        messages: list[dict],
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        repeat_penalty: Optional[float] = None,
        context_length: Optional[int] = None,
        stop: Optional[list[str]] = None,
    ) -> AsyncGenerator[dict, None]:
        options = {}
        if temperature is not None:
            options["temperature"] = temperature
        if top_p is not None:
            options["top_p"] = top_p
        if top_k is not None:
            options["top_k"] = top_k
        if repeat_penalty is not None:
            options["repeat_penalty"] = repeat_penalty
        if context_length is not None:
            options["num_ctx"] = context_length
        if stop is not None:
            options["stop"] = stop

        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": options,
        }

        async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
            async with client.stream("POST", "/api/chat", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            yield json.loads(line)
                        except json.JSONDecodeError:
                            continue


ollama_service = OllamaService()
