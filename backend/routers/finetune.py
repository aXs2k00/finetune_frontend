from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
import time
import asyncio
from ..models.schemas import (
    FineTuneJobCreate,
    FineTuneJobResponse,
    JobStatusEnum,
)

router = APIRouter(prefix="/api/finetune", tags=["finetune"])

job_store: dict = {}


@router.get("/jobs", response_model=List[FineTuneJobResponse])
async def list_jobs():
    return [
        FineTuneJobResponse(
            id=data["id"],
            name=data["name"],
            base_model=data["base_model"],
            dataset_name=data.get("dataset_name"),
            status=JobStatusEnum(data["status"]),
            progress=data["progress"],
            epochs=data["epochs"],
            learning_rate=data["learning_rate"],
            batch_size=data["batch_size"],
            validation_split=data["validation_split"],
            created_at=data["created_at"],
            updated_at=data["updated_at"],
            completed_at=data.get("completed_at"),
            error_message=data.get("error_message"),
        )
        for data in job_store.values()
    ]


@router.post("/jobs", response_model=FineTuneJobResponse)
async def create_job(request: FineTuneJobCreate):
    now = time.time()
    job_id = len(job_store) + 1
    job_store[str(job_id)] = {
        "id": job_id,
        "name": request.name,
        "base_model": request.base_model,
        "dataset_name": request.dataset_name,
        "status": JobStatusEnum.PENDING.value,
        "progress": 0.0,
        "epochs": request.epochs,
        "learning_rate": request.learning_rate,
        "batch_size": request.batch_size,
        "validation_split": request.validation_split,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
        "error_message": None,
        "logs": "",
    }
    data = job_store[str(job_id)]
    return FineTuneJobResponse(
        id=data["id"],
        name=data["name"],
        base_model=data["base_model"],
        dataset_name=data.get("dataset_name"),
        status=JobStatusEnum(data["status"]),
        progress=data["progress"],
        epochs=data["epochs"],
        learning_rate=data["learning_rate"],
        batch_size=data["batch_size"],
        validation_split=data["validation_split"],
        created_at=data["created_at"],
        updated_at=data["updated_at"],
        completed_at=data.get("completed_at"),
        error_message=data.get("error_message"),
    )


@router.get("/jobs/{job_id}", response_model=FineTuneJobResponse)
async def get_job(job_id: int):
    key = str(job_id)
    if key not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    data = job_store[key]
    return FineTuneJobResponse(
        id=data["id"],
        name=data["name"],
        base_model=data["base_model"],
        dataset_name=data.get("dataset_name"),
        status=JobStatusEnum(data["status"]),
        progress=data["progress"],
        epochs=data["epochs"],
        learning_rate=data["learning_rate"],
        batch_size=data["batch_size"],
        validation_split=data["validation_split"],
        created_at=data["created_at"],
        updated_at=data["updated_at"],
        completed_at=data.get("completed_at"),
        error_message=data.get("error_message"),
    )


@router.delete("/jobs/{job_id}")
async def cancel_job(job_id: int):
    key = str(job_id)
    if key not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_store[key]["status"] = JobStatusEnum.CANCELLED.value
    job_store[key]["updated_at"] = time.time()
    return {"status": "success", "message": "Job cancelled"}


@router.get("/jobs/{job_id}/logs")
async def get_job_logs(job_id: int):
    key = str(job_id)
    if key not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"logs": job_store[key].get("logs", "")}


async def simulate_finetune(job_id: int):
    await asyncio.sleep(2)
    job_store[str(job_id)]["status"] = JobStatusEnum.RUNNING.value
    job_store[str(job_id)]["logs"] = f"Starting fine-tuning job {job_id}...\n"
    
    for i in range(10):
        await asyncio.sleep(1)
        if str(job_id) not in job_store:
            break
        progress = (i + 1) * 10.0
        job_store[str(job_id)]["progress"] = progress
        job_store[str(job_id)]["logs"] += f"Epoch {i+1}/10 - Loss: {0.5 - i*0.04:.4f}\n"
    
    if str(job_id) in job_store:
        job_store[str(job_id)]["status"] = JobStatusEnum.COMPLETED.value
        job_store[str(job_id)]["progress"] = 100.0
        job_store[str(job_id)]["completed_at"] = time.time()
        job_store[str(job_id)]["logs"] += "Fine-tuning completed successfully!\n"


@router.post("/jobs/{job_id}/start")
async def start_job(job_id: int, background_tasks: BackgroundTasks):
    key = str(job_id)
    if key not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    background_tasks.add_task(simulate_finetune, job_id)
    return {"status": "success", "message": "Job started"}