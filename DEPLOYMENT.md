# DocKonvert — Deployment Guide

## Architecture Overview

```
LOCAL DEV                              PRODUCTION
┌──────────┐  ┌──────────┐  ┌────────────┐     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  web     │  │  api     │  │ miniflare  │     │ Cloudflare   │  │ Cloud Run    │  │ Cloudflare   │
│  :3009   │  │  :8009   │  │  :8788     │     │ Pages        │  │ (or similar) │  │ D1 + R2      │
│  Next.js │→ │ FastAPI  │→ │ D1 + R2    │     │ Next.js      │→ │ FastAPI      │→ │ Real services│
└──────────┘  └──────────┘  └────────────┘     └──────────────┘  └──────────────┘  └──────────────┘
     docker-compose (all local)                      deployed separately
```

## Local Development (Miniflare)

Everything runs in Docker with miniflare simulating Cloudflare D1 + R2.

```bash
docker compose up --build -d
```

| Service   | URL                        | Purpose                    |
|-----------|----------------------------|----------------------------|
| web       | http://localhost:3009      | Next.js frontend           |
| api       | http://localhost:8009      | FastAPI backend            |
| miniflare | http://localhost:8788      | Local D1 (SQLite) + R2     |
| Swagger   | http://localhost:8009/api/docs | API documentation      |

The API uses `.env.backend` which points all Cloudflare calls to miniflare:
- D1 queries → `http://miniflare:8788/d1/query`
- R2 uploads → `http://miniflare:8788/r2/{key}`

---

## Deploying to Production

### What changes

| Component       | Local (miniflare)                  | Production (Cloudflare)                                      |
|-----------------|------------------------------------|--------------------------------------------------------------|
| D1 database     | `http://miniflare:8788/d1/*`       | `https://api.cloudflare.com/client/v4/accounts/{id}/d1/...`  |
| R2 storage      | `http://miniflare:8788/r2/*`       | S3-compatible: `https://{account}.r2.cloudflarestorage.com`  |
| Config file     | `.env.backend`                     | `.env` (or Cloud Run env vars)                               |
| `APP_ENV`       | `development`                      | `production`                                                 |
| `MINIFLARE_URL` | `http://miniflare:8788`            | _(empty — not set)_                                          |

### How the switch works

The API auto-detects local vs production via `config.py`:

```python
@property
def is_local(self) -> bool:
    return self.app_env == "development" and bool(self.miniflare_url)
```

- When `is_local` is `True` → D1/R2 clients talk to miniflare
- When `is_local` is `False` → D1/R2 clients talk to real Cloudflare APIs

**You don't change any code. Just change environment variables.**

---

## Step-by-Step: Deploy API to Google Cloud Run

### 1. Prerequisites

```bash
# Install gcloud CLI
brew install google-cloud-sdk

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Set up Cloudflare resources

#### Create D1 database
```bash
npx wrangler d1 create dockonvert-db
# Note the database_id from the output
```

#### Initialize D1 schema
```bash
npx wrangler d1 execute dockonvert-db --file=packages/db/schema.sql
```

#### Create R2 bucket
```bash
npx wrangler r2 bucket create dockonvert-files
```

#### Generate R2 API credentials
1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create a token with read/write access to `dockonvert-files`
3. Note the Access Key ID and Secret Access Key

#### Get Cloudflare API token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create a token with D1 read/write permissions
3. Note the token

### 3. Build and push Docker image

```bash
# Build from repo root (API Dockerfile uses root context)
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/dockonvert-api .
```

### 4. Deploy to Cloud Run

```bash
gcloud run deploy dockonvert-api \
  --image gcr.io/YOUR_PROJECT_ID/dockonvert-api \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --allow-unauthenticated \
  --set-env-vars "\
APP_ENV=production,\
APP_SECRET_KEY=$(openssl rand -hex 32),\
CORS_ORIGINS=https://your-domain.com,\
R2_ACCOUNT_ID=your_cf_account_id,\
R2_ACCESS_KEY_ID=your_r2_access_key,\
R2_SECRET_ACCESS_KEY=your_r2_secret,\
R2_BUCKET_NAME=dockonvert-files,\
R2_ENDPOINT=https://your_cf_account_id.r2.cloudflarestorage.com,\
CF_API_TOKEN=your_cf_api_token,\
CF_ACCOUNT_ID=your_cf_account_id,\
D1_DATABASE_ID=your_d1_database_id,\
RATE_LIMIT_PER_HOUR=100,\
MAX_FILE_SIZE_MB=10,\
RESEND_API_KEY=your_resend_api_key,\
EMAIL_FROM=DocKonvert <noreply@dockonvert.com>,\
FRONTEND_URL=https://your-domain.com"
```

### 5. Deploy frontend to Cloudflare Pages

```bash
cd apps/web
npx wrangler pages deploy .next --project-name dockonvert
```

Or connect your GitHub repo in the Cloudflare Pages dashboard for auto-deploy.

Set these environment variables in Cloudflare Pages:
```
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://dockonvert-api-xxxxx.run.app/api
NEXT_PUBLIC_APP_VERSION=0.1.0
```

---

## Environment Variables Reference

### API (`.env` for production, `.env.backend` for local)

| Variable               | Local Value                    | Production Value                                    | Required |
|------------------------|--------------------------------|-----------------------------------------------------|----------|
| `APP_ENV`              | `development`                  | `production`                                        | Yes      |
| `APP_SECRET_KEY`       | any string                     | `openssl rand -hex 32`                              | Yes      |
| `CORS_ORIGINS`         | `http://localhost:3009`        | `https://your-domain.com`                           | Yes      |
| `MINIFLARE_URL`        | `http://miniflare:8788`        | _(not set)_                                         | No       |
| `D1_BASE_URL`          | `http://miniflare:8788/d1`     | _(not set)_                                         | No       |
| `R2_BASE_URL`          | `http://miniflare:8788/r2`     | _(not set)_                                         | No       |
| `R2_ACCOUNT_ID`        | `local-dev`                    | Your Cloudflare account ID                          | Yes      |
| `R2_ACCESS_KEY_ID`     | `local-dev`                    | R2 API token access key                             | Yes      |
| `R2_SECRET_ACCESS_KEY` | `local-dev`                    | R2 API token secret                                 | Yes      |
| `R2_BUCKET_NAME`       | `dockonvert-files`             | `dockonvert-files`                                  | Yes      |
| `R2_ENDPOINT`          | `http://miniflare:8788/r2`     | `https://{account_id}.r2.cloudflarestorage.com`     | Yes      |
| `CF_API_TOKEN`         | `local-dev`                    | Cloudflare API token (D1 access)                    | Yes      |
| `CF_ACCOUNT_ID`        | `local-dev`                    | Your Cloudflare account ID                          | Yes      |
| `D1_DATABASE_ID`       | `local-dev-db`                 | D1 database ID from `wrangler d1 create`            | Yes      |
| `RATE_LIMIT_PER_HOUR`  | `100`                          | `100`                                               | Yes      |
| `MAX_FILE_SIZE_MB`     | `10`                           | `10`                                                | Yes      |

### Frontend (`.env.local`)

| Variable                        | Local Value                | Production Value                          |
|---------------------------------|----------------------------|-------------------------------------------|
| `NEXT_PUBLIC_APP_URL`           | `http://localhost:3009`    | `https://your-domain.com`                 |
| `NEXT_PUBLIC_API_URL`           | `http://localhost:8009/api`| `https://your-api-url.run.app/api`        |
| `NEXT_PUBLIC_APP_VERSION`       | `0.1.0`                   | auto-set by CI                            |

---

## Checklist: Local → Production

- [ ] Create Cloudflare D1 database and run schema
- [ ] Create Cloudflare R2 bucket and generate API token
- [ ] Generate Cloudflare API token for D1 access
- [ ] Build and push Docker image to container registry
- [ ] Deploy to Cloud Run with production env vars
- [ ] Set `APP_ENV=production` (disables miniflare routing)
- [ ] Do NOT set `MINIFLARE_URL` (ensures `is_local` returns `False`)
- [ ] Update `CORS_ORIGINS` to your production frontend URL
- [ ] Deploy frontend to Cloudflare Pages with production API URL
- [ ] Generate a strong `APP_SECRET_KEY` with `openssl rand -hex 32`
- [ ] Test `/api/health` endpoint
- [ ] Test `/api/v1/convert/markdown` with a sample file
