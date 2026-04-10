from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class FineTuneJob(Base):
    __tablename__ = "finetune_jobs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    base_model = Column(String(255), nullable=False)
    dataset_name = Column(String(255), nullable=True)
    status = Column(SQLEnum(JobStatus), default=JobStatus.PENDING)
    progress = Column(Float, default=0.0)
    epochs = Column(Integer, default=3)
    learning_rate = Column(Float, default=0.001)
    batch_size = Column(Integer, default=16)
    validation_split = Column(Float, default=0.1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    logs = Column(Text, nullable=True)


class Modelfile(Base):
    __tablename__ = "modelfiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    content = Column(Text, nullable=False)
    model_name = Column(String(255), nullable=True)
    parameters = Column(JSON, nullable=True)
    system_prompt = Column(Text, nullable=True)
    template = Column(Text, nullable=True)
    license = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(255), nullable=False)
    messages = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    title = Column(String(255), nullable=True)


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    filename = Column(String(255), nullable=False)
    format = Column(String(50), default="jsonl")
    row_count = Column(Integer, default=0)
    validated = Column(Boolean, default=False)
    validation_errors = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)