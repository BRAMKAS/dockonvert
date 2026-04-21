# DocKonvert

**Document Conversion API by BRAMKAS INC**

Convert any document to Markdown or PDF via a simple REST API. Powered by [Docling](https://github.com/DS4SD/docling).

## Architecture

```
dockonvert/
├── apps/
│   ├── web/          # Next.js frontend (Cloudflare Pages)
│   └── api/          # FastAPI backend (Docker / Cloud Run)
├── packages/
│   ├── db/           # D1 database schema
│   └── shared/       # Shared version & constants
├── .github/workflows # CI + auto version bump
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (optional)

### Local Development

```bash
# Install frontend dependencies
npm install

# Start frontend
npm run dev:web

# Start API (in another terminal)
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker Compose

```bash
docker compose up
```

- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/convert/markdown` | Convert document to Markdown |
| POST | `/api/v1/convert/pdf` | Convert document to PDF |
| GET | `/api/health` | Health check |

## Environment Variables

Copy `.env.local` (frontend) and `.env` (API) and fill in your values.

## License

Proprietary — © BRAMKAS INC. All rights reserved.
