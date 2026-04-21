"""Job engine — creates, processes, and manages conversion jobs."""

import asyncio
import secrets
import json
from datetime import datetime, timezone

import httpx

from app.services import d1, r2
from app.services.converter import convert
from app.models import JobStatus, ConversionFormat, ConversionOptions


async def create_job(user_id: str, tasks: dict, webhook: dict | None = None, tag: str | None = None) -> str:
    """Create a new job record in D1. Returns job_id."""
    job_id = secrets.token_hex(16)
    now = datetime.now(timezone.utc).isoformat()

    await d1.execute(
        """INSERT INTO jobs (id, user_id, status, tasks, webhook, tag, created_at, updated_at)
           VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)""",
        [job_id, user_id, json.dumps(tasks), json.dumps(webhook) if webhook else None, tag, now, now],
    )
    return job_id


async def get_job(job_id: str, user_id: str) -> dict | None:
    """Get a job by ID for a specific user."""
    result = await d1.query(
        "SELECT * FROM jobs WHERE id = ? AND user_id = ?",
        [job_id, user_id],
    )
    rows = result.get("results", [])
    return rows[0] if rows else None


async def list_jobs(user_id: str, status: str | None = None, tag: str | None = None, limit: int = 50) -> list[dict]:
    """List jobs for a user with optional filters."""
    sql = "SELECT * FROM jobs WHERE user_id = ?"
    params: list = [user_id]

    if status:
        sql += " AND status = ?"
        params.append(status)
    if tag:
        sql += " AND tag = ?"
        params.append(tag)

    sql += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    result = await d1.query(sql, params)
    return result.get("results", [])


async def update_job_status(job_id: str, status: str, task_results: dict | None = None, error: str | None = None):
    """Update job status and optionally task results."""
    now = datetime.now(timezone.utc).isoformat()
    if task_results:
        await d1.execute(
            "UPDATE jobs SET status = ?, task_results = ?, updated_at = ? WHERE id = ?",
            [status, json.dumps(task_results), now, job_id],
        )
    elif error:
        await d1.execute(
            "UPDATE jobs SET status = ?, error = ?, updated_at = ? WHERE id = ?",
            [status, error, now, job_id],
        )
    else:
        await d1.execute(
            "UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?",
            [status, now, job_id],
        )


async def process_job(job_id: str, user_id: str, tasks: dict, webhook: dict | None = None, uploaded_content: bytes | None = None, uploaded_filename: str | None = None):
    """Process a job asynchronously — runs import → convert → export pipeline."""
    try:
        await update_job_status(job_id, "processing")

        task_results = {}
        file_content: bytes | None = uploaded_content
        filename: str = uploaded_filename or "document"
        content_type: str = "application/octet-stream"

        # ── Phase 1: Import ──
        for name, task in tasks.items():
            op = task.get("operation", "")

            if op == "import/url":
                url = task["url"]
                filename = task.get("filename") or url.split("/")[-1].split("?")[0] or "document"
                async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    file_content = resp.content
                    content_type = resp.headers.get("content-type", "application/octet-stream")
                task_results[name] = {"status": "completed", "filename": filename, "size": len(file_content)}

            elif op == "import/upload":
                if not uploaded_content:
                    raise ValueError("No file uploaded for import/upload task")
                task_results[name] = {"status": "completed", "filename": filename, "size": len(file_content)}

        if not file_content:
            raise ValueError("No input file — add an import task")

        # ── Phase 2: Convert ──
        for name, task in tasks.items():
            op = task.get("operation", "")
            if op != "convert":
                continue

            output_format = task.get("output_format", "markdown")
            options = task.get("options") or {}
            opts = ConversionOptions(**options) if options else ConversionOptions()

            result_bytes, output_filename, output_ct = await convert(
                file_content, filename, content_type, output_format, opts
            )

            # Store result in R2
            r2_key = f"jobs/{job_id}/{output_filename}"
            await r2.upload(r2_key, result_bytes, output_ct)

            task_results[name] = {
                "status": "completed",
                "filename": output_filename,
                "size": len(result_bytes),
                "content_type": output_ct,
                "r2_key": r2_key,
            }

            # Also store input in R2
            input_r2_key = f"jobs/{job_id}/input/{filename}"
            await r2.upload(input_r2_key, file_content, content_type)

            # Log to documents table
            await d1.execute(
                """INSERT INTO documents (user_id, input_filename, input_r2_key, input_content_type, input_size_bytes,
                    output_filename, output_r2_key, output_content_type, output_size_bytes, conversion_type, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')""",
                [user_id, filename, input_r2_key, content_type, len(file_content),
                 output_filename, r2_key, output_ct, len(result_bytes),
                 f"to_{output_format}"],
            )

            # Update file_content for chaining
            file_content = result_bytes
            filename = output_filename
            content_type = output_ct

        # ── Phase 3: Export ──
        for name, task in tasks.items():
            op = task.get("operation", "")

            if op == "export/url":
                # Find the convert task result to get the r2_key
                input_task = task.get("input", "")
                if input_task in task_results and "r2_key" in task_results[input_task]:
                    r2_key = task_results[input_task]["r2_key"]
                    task_results[name] = {
                        "status": "completed",
                        "r2_key": r2_key,
                        "filename": task_results[input_task].get("filename"),
                    }
                else:
                    task_results[name] = {"status": "completed", "note": "direct download via job endpoint"}

            elif op == "export/s3":
                input_task = task.get("input", "")
                if input_task in task_results and "r2_key" in task_results[input_task]:
                    # Download from our R2 and upload to their S3
                    r2_key = task_results[input_task]["r2_key"]
                    data, ct = await r2.download(r2_key)

                    import boto3
                    s3 = boto3.client(
                        "s3",
                        endpoint_url=task.get("endpoint"),
                        aws_access_key_id=task["access_key_id"],
                        aws_secret_access_key=task["secret_access_key"],
                        region_name=task.get("region", "auto"),
                    )
                    s3.put_object(Bucket=task["bucket"], Key=task["key"], Body=data, ContentType=ct)
                    task_results[name] = {"status": "completed", "bucket": task["bucket"], "key": task["key"]}

        await update_job_status(job_id, "completed", task_results=task_results)

        # ── Webhook ──
        if webhook and webhook.get("url"):
            await _fire_webhook(webhook, job_id, "job.completed", task_results)

    except Exception as e:
        await update_job_status(job_id, "failed", error=str(e))
        if webhook and webhook.get("url"):
            await _fire_webhook(webhook, job_id, "job.failed", {"error": str(e)})


async def _fire_webhook(webhook: dict, job_id: str, event: str, data: dict):
    """Send webhook notification."""
    events = webhook.get("events", ["job.completed", "job.failed"])
    if event not in events:
        return

    headers = {"Content-Type": "application/json"}
    if webhook.get("headers"):
        headers.update(webhook["headers"])

    payload = {"event": event, "job_id": job_id, "data": data}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(webhook["url"], json=payload, headers=headers)
    except Exception:
        pass  # Best effort — don't fail the job for webhook errors
