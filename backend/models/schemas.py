from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class JobStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ModelParams(BaseModel):
    temperature: float = Field(default=0.7, ge=0, le=2)
    top_p: float = Field(default=0.9, ge=0, le=1)
    top_k: int = Field(default=40, ge=1, le=100)
    repeat_penalty: float = Field(default=1.1, ge=0, le=2)
    context_length: int = Field(default=4096, ge=256, le=8192)
    stop: Optional[List[str]] = None


class OllamaModel(BaseModel):
    name: str
    size: int
    modified_at: Optional[datetime] = None
    digest: Optional[str] = None


class OllamaModelDetails(BaseModel):
    modelfile: Optional[str] = None
    parameters: Optional[str] = None
    template: Optional[str] = None


class ModelfileCreate(BaseModel):
    name: str
    content: str
    model_name: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = None
    template: Optional[str] = None
    license: Optional[str] = None


class ModelfileResponse(BaseModel):
    id: int
    name: str
    content: str
    model_name: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = None
    template: Optional[str] = None
    license: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FineTuneJobCreate(BaseModel):
    name: str
    base_model: str
    dataset_name: Optional[str] = None
    epochs: int = Field(default=3, ge=1, le=100)
    learning_rate: float = Field(default=0.001, ge=0.0001, le=0.1)
    batch_size: int = Field(default=16, ge=1, le=512)
    validation_split: float = Field(default=0.1, ge=0, le=0.5)


class FineTuneJobResponse(BaseModel):
    id: int
    name: str
    base_model: str
    dataset_name: Optional[str] = None
    status: JobStatusEnum
    progress: float
    epochs: int
    learning_rate: float
    batch_size: int
    validation_split: float
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    stream: bool = False
    temperature: float = Field(default=0.7, ge=0, le=2)
    top_p: float = Field(default=0.9, ge=0, le=1)
    top_k: int = Field(default=40, ge=1, le=100)
    repeat_penalty: float = Field(default=1.1, ge=0, le=2)
    context_length: int = Field(default=4096, ge=256, le=8192)


class ChatCompletionResponse(BaseModel):
    model: str
    message: ChatMessage
    done: bool


class ConversationCreate(BaseModel):
    model_name: str
    messages: List[ChatMessage]
    title: Optional[str] = None


class ConversationResponse(BaseModel):
    id: int
    model_name: str
    messages: List[Dict[str, str]]
    title: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DatasetCreate(BaseModel):
    name: str
    filename: str


class DatasetResponse(BaseModel):
    id: int
    name: str
    filename: str
    format: str
    row_count: int
    validated: bool
    validation_errors: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PullModelRequest(BaseModel):
    name: str


class CompletionRequest(BaseModel):
    model: str
    prompt: str
    stream: bool = True
    temperature: float = Field(default=0.7, ge=0, le=2)
    top_p: float = Field(default=0.9, ge=0, le=1)
    top_k: int = Field(default=40, ge=1, le=100)
    repeat_penalty: float = Field(default=1.1, ge=0, le=2)
    context_length: int = Field(default=4096, ge=256, le=8192)
    stop: Optional[List[str]] = None


class SystemStats(BaseModel):
    ollama_connected: bool
    cpu_percent: Optional[float] = None
    memory_total: Optional[int] = None
    memory_used: Optional[int] = None
    gpu_available: bool = False
    gpu_info: Optional[List[Dict[str, Any]]] = None