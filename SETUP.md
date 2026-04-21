# DocKonvert — Setup Guide

## GitHub Actions Deployment

Push to `main` auto-deploys:
- **API** → Google Cloud Run (when `apps/api/` changes)
- **Web** → Cloudflare Pages (when `apps/web/` changes)

---

## Step 1: GCP Setup (API)

### 1.1 Create a new billing account (for free tier)
1. Go to [GCP Console → Billing](https://console.cloud.google.com/billing)
2. Click "Manage billing accounts" → "Create account"
3. Add a payment method

### 1.2 Create a project
```bash
gcloud projects create dockonvert-prod --name="DocKonvert"
gcloud config set project dockonvert-prod
gcloud billing projects link dockonvert-prod --billing-account=YOUR_BILLING_ACCOUNT_ID
```

### 1.3 Enable APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 1.4 Create a service account for GitHub Actions
```bash
gcloud iam service-accounts create github-deploy \
  --display-name="GitHub Actions Deploy"

# Grant permissions
gcloud projects add-iam-policy-binding dockonvert-prod \
  --member="serviceAccount:github-deploy@dockonvert-prod.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding dockonvert-prod \
  --member="serviceAccount:github-deploy@dockonvert-prod.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding dockonvert-prod \
  --member="serviceAccount:github-deploy@dockonvert-prod.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Generate key
gcloud iam service-accounts keys create gcp-key.json \
  --iam-account=github-deploy@dockonvert-prod.iam.gserviceaccount.com
```

### 1.5 Add GCP secret to GitHub
1. Go to your repo → Settings → Secrets and variables → Actions
2. Add secret: `GCP_SA_KEY` = contents of `gcp-key.json`
3. Add secret: `GCP_PROJECT_ID` = `dockonvert-prod`
4. Delete the local key file: `rm gcp-key.json`

---

## Step 2: Cloudflare Setup (Web + D1 + R2)

### 2.1 Create D1 database
```bash
npx wrangler d1 create dockonvert-db
# Note the database_id from output
```

### 2.2 Initialize D1 schema
```bash
npx wrangler d1 execute dockonvert-db --file=packages/db/schema.sql
```

### 2.3 Create R2 bucket
```bash
npx wrangler r2 bucket create dockonvert-files
```

### 2.4 Get R2 API credentials
1. Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create token with read/write on `dockonvert-files`
3. Note Access Key ID and Secret Access Key

### 2.5 Get Cloudflare API token
1. [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Create token with: D1 Edit, Pages Edit, Account Read
3. Note the token and your Account ID

### 2.6 Create Cloudflare Pages project
```bash
npx wrangler pages project create dockonvert
```

---

## Step 3: Resend Setup (Email)

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create an API key
4. Note the API key

---

## Step 4: GitHub Secrets

Add all these secrets in your repo → Settings → Secrets → Actions:

### GCP (API deployment)
| Secret | Value |
|--------|-------|
| `GCP_SA_KEY` | Contents of the service account JSON key |
| `GCP_PROJECT_ID` | Your GCP project ID (e.g. `dockonvert-prod`) |

### Cloudflare (Web + D1 + R2)
| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

### App secrets (passed to Cloud Run as env vars)
| Secret | Value |
|--------|-------|
| `APP_SECRET_KEY` | Run: `openssl rand -hex 32` |
| `CORS_ORIGINS` | `https://your-domain.com` |
| `FRONTEND_URL` | `https://your-domain.com` |
| `CF_API_TOKEN` | Cloudflare API token (for D1 access) |
| `CF_ACCOUNT_ID` | Cloudflare account ID |
| `D1_DATABASE_ID` | D1 database ID from step 2.1 |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | `dockonvert-files` |
| `R2_ENDPOINT` | `https://{account_id}.r2.cloudflarestorage.com` |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | `DocKonvert <noreply@your-domain.com>` |

### Frontend build vars
| Secret | Value |
|--------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_API_URL` | `https://dockonvert-api-xxxxx.run.app/api` |

---

## Step 5: Deploy

Push to `main` and both workflows trigger automatically.

Or trigger manually:
1. Go to Actions tab in GitHub
2. Select "Deploy API to Cloud Run" or "Deploy Web to Cloudflare Pages"
3. Click "Run workflow"

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Cloudflare Pages │────▶│ Google Cloud Run  │────▶│ Cloudflare D1   │
│ (Next.js)       │     │ (FastAPI+Docling) │     │ (SQLite DB)     │
│ your-domain.com │     │ *.run.app         │     └─────────────────┘
└─────────────────┘     └──────────────────┘────▶┌─────────────────┐
                                                  │ Cloudflare R2   │
                                                  │ (File storage)  │
                                                  └─────────────────┘
```

**Cost: ~$5/month** (Cloudflare Workers paid plan, everything else free tier)
