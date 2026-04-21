"""Pydantic models for the job system."""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class ConversionFormat(str, Enum):
    markdown = "markdown"
    pdf = "pdf"
    html = "html"
    txt = "txt"
    docx = "docx"
    csv = "csv"
    json = "json"
    xml = "xml"
    epub = "epub"


class ImportType(str, Enum):
    upload = "upload"
    url = "url"


class ExportType(str, Enum):
    url = "url"  # temporary download URL
    s3 = "s3"    # export to S3-compatible storage


# ── Conversion Options ──

class ConversionOptions(BaseModel):
    page_range: Optional[str] = Field(None, description="Page range for PDF input, e.g. '1-5' or '1,3,5'")
    quality: Optional[int] = Field(None, ge=1, le=100, description="Output quality (1-100), applies to image/PDF output")
    ocr: Optional[bool] = Field(True, description="Enable OCR for scanned documents")
    table_mode: Optional[str] = Field("accurate", description="Table extraction mode: 'fast' or 'accurate'")
    include_images: Optional[bool] = Field(True, description="Include images in markdown output")
    pdf_page_size: Optional[str] = Field("A4", description="Page size for PDF output: A4, Letter, Legal")
    pdf_margin: Optional[str] = Field("40px", description="Margin for PDF output")


# ── Job Task Models ──

class ImportUrlTask(BaseModel):
    operation: str = "import/url"
    url: str
    filename: Optional[str] = None


class ImportUploadTask(BaseModel):
    operation: str = "import/upload"


class ConvertTask(BaseModel):
    operation: str = "convert"
    input: str = Field(..., description="Name of the input task")
    output_format: ConversionFormat
    options: Optional[ConversionOptions] = None


class ExportUrlTask(BaseModel):
    operation: str = "export/url"
    input: str = Field(..., description="Name of the task to export")


class ExportS3Task(BaseModel):
    operation: str = "export/s3"
    input: str
    bucket: str
    key: str
    access_key_id: str
    secret_access_key: str
    endpoint: Optional[str] = None
    region: Optional[str] = "auto"


class WebhookConfig(BaseModel):
    url: str
    events: list[str] = Field(default=["job.completed", "job.failed"])
    headers: Optional[dict[str, str]] = None


# ── Job Request/Response ──

class JobCreateRequest(BaseModel):
    tasks: dict[str, dict] = Field(..., description="Named tasks: import, convert, export")
    webhook: Optional[WebhookConfig] = None
    tag: Optional[str] = Field(None, description="Custom tag for filtering jobs")


class TaskResponse(BaseModel):
    name: str
    operation: str
    status: JobStatus
    result: Optional[dict] = None
    error: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    status: JobStatus
    tag: Optional[str] = None
    tasks: list[TaskResponse] = []
    created_at: str
    updated_at: Optional[str] = None
    download_url: Optional[str] = None


# ── Simple Convert (backwards compatible) ──

class SimpleConvertRequest(BaseModel):
    output_format: ConversionFormat = ConversionFormat.markdown
    options: Optional[ConversionOptions] = None
    webhook_url: Optional[str] = None
