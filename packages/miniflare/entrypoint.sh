#!/bin/sh
set -e

echo "🔧 Initializing D1 database..."
# Run schema init — may fail on first run before state dir exists, that's OK
npx wrangler d1 execute dockonvert-db \
  --local \
  --file=/app/schema.sql \
  --persist-to /app/.wrangler/state 2>&1 || echo "⚠️  D1 init skipped (will retry on first query)"

echo "🚀 Starting miniflare (local Cloudflare Workers)..."
exec npx wrangler dev \
  --port 8788 \
  --ip 0.0.0.0 \
  --local \
  --persist-to /app/.wrangler/state \
  --no-show-interactive-dev-session
