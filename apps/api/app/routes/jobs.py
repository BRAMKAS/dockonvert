"""Job routes — async conversion pipeline with import/convert/export tasks."""

import asyncio
import json

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
import io

from app.routes.auth import get_current_user
from app.services import jobs as job_service, r2
from app.models import JobCreateRequest, JobResponse, TaskResponse, JobStatus

router = APIRouter()


@router.post("/jobs", response_model=JobResponse)
async def create_job(req: JobCreateRequest, user=Depends(get_current_user)):
    """Create an async conversion job with a task pipeline.

    Example:
    ```json
    {
      "tasks": {
        "import-file": { "operation": "import/url", "url": "https://example.com/doc.pdf" },
        "convert": { "operation": "convert", "input": "import-file", "output_format": "markdown" },
        "export": { "operation": "export/url", "input": "convert" }
      }
    }
    ```
    """
    # Validate tasks
    has_import = any(t.get("operation", "").startswith("import/") for t in req.tasks.values())
    has_convert = any(t.get("operation") == "convert" for t in req.tasks.values())

    if not has_import:
        raise HTTPException(status_code=400, detail="Job must have at least one import task (import/url or import/upload)")
    if not has_convert:
        raise HTTPException(status_code=400, detail="Job must have at least one convert task")

    webhook = req.webhook.model_dump() if req.webhook else None
    job_id = await job_service.create_job(user["id"], req.tasks, webhook, req.tag)

    # Check if it's a URL import (can process immediately)
    has_url_import = any(t.get("operation") == "import/url" for t in req.tasks.values())
    if has_url_import:
        asyncio.create_task(
            job_service.process_job(job_id, user["id"], req.tasks, webhook)
        )

    job = await job_service.get_job(job_id, user["id"])
    return _format_job(job)


@router.post("/jobs/upload", response_model=JobResponse)
async def create_upload_job(
    file: UploadFile = File(...),
    output_format: str = Form("markdown"),
    options: str = Form("{}"),
    webhook_url: str = Form(None),
    tag: str = Form(None),
    user=Depends(get_current_user),
):
    """Create a job with file upload — simplified endpoint.

    Automatically creates import/upload → convert → export/url pipeline.
    """
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds 10MB limit")

    parsed_options = json.loads(options) if options and options != "{}" else {}

    tasks = {
        "import-file": {"operation": "import/upload"},
        "convert": {
            "operation": "convert",
            "input": "import-file",
            "output_format": output_format,
            "options": parsed_options,
        },
        "export": {"operation": "export/url", "input": "convert"},
    }

    webhook = {"url": webhook_url} if webhook_url else None
    job_id = await job_service.create_job(user["id"], tasks, webhook, tag)

    # Process immediately in background
    asyncio.create_task(
        job_service.process_job(
            job_id, user["id"], tasks, webhook,
            uploaded_content=content,
            uploaded_filename=file.filename,
        )
    )

    job = await job_service.get_job(job_id, user["id"])
    return _format_job(job)


@router.get("/jobs", response_model=list[JobResponse])
async def list_jobs(
    status: str = Query(None, description="Filter by status: pending, processing, completed, failed"),
    tag: str = Query(None, description="Filter by custom tag"),
    limit: int = Query(50, ge=1, le=100),
    user=Depends(get_current_user),
):
    """List all jobs for the authenticated user."""
    jobs = await job_service.list_jobs(user["id"], status, tag, limit)
    return [_format_job(j) for j in jobs]


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, user=Depends(get_current_user)):
    """Get job status and results."""
    job = await job_service.get_job(job_id, user["id"])
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _format_job(job)


@router.get("/jobs/{job_id}/download")
async def download_job_result(job_id: str, task: str = Query("convert", description="Task name to download"), user=Depends(get_current_user)):
    """Download the output file from a completed job."""
    job = await job_service.get_job(job_id, user["id"])
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Job is {job['status']}, not completed")

    task_results = json.loads(job.get("task_results") or "{}")
    task_result = task_results.get(task)
    if not task_result or "r2_key" not in task_result:
        raise HTTPException(status_code=404, detail=f"No downloadable result for task '{task}'")

    data, content_type = await r2.download(task_result["r2_key"])
    filename = task_result.get("filename", "output")

    return StreamingResponse(
        io.BytesIO(data),
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, user=Depends(get_current_user)):
    """Delete a job and its associated files."""
    job = await job_service.get_job(job_id, user["id"])
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Clean up R2 files
    task_results = json.loads(job.get("task_results") or "{}")
    for task_result in task_results.values():
        if "r2_key" in task_result:
            try:
                await r2.delete(task_result["r2_key"])
            except Exception:
                pass

    from app.services import d1
    await d1.execute("DELETE FROM jobs WHERE id = ? AND user_id = ?", [job_id, user["id"]])
    return {"message": "Job deleted"}


def _format_job(job: dict) -> dict:
    """Format a job record into the API response shape."""
    task_results = json.loads(job.get("task_results") or "{}")
    tasks_raw = json.loads(job.get("tasks") or "{}")

    tasks = []
    for name, task_def in tasks_raw.items():
        result = task_results.get(name, {})
        tasks.append(TaskResponse(
            name=name,
            operation=task_def.get("operation", ""),
            status=result.get("status", "pending"),
            result={k: v for k, v in result.items() if k != "status"} if result else None,
            error=result.get("error"),
        ))

    # Find download URL from export task
    download_url = None
    if job["status"] == "completed":
        download_url = f"/api/v1/jobs/{job['id']}/download"

    return JobResponse(
        id=job["id"],
        status=job["status"],
        tag=job.get("tag"),
        tasks=tasks,
        created_at=job["created_at"],
        updated_at=job.get("updated_at"),
        download_url=download_url,
    ).model_dump()
