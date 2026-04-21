from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routes import convert, health, auth, documents, jobs

settings = get_settings()

app = FastAPI(
    title="DocKonvert API",
    description="Convert documents to Markdown and PDF — by BRAMKAS INC",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(jobs.router, prefix="/api/v1", tags=["Jobs"])
app.include_router(documents.router, prefix="/api/v1", tags=["Documents"])
app.include_router(convert.router, prefix="/api/v1", tags=["Conversion"])
