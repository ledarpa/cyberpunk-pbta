#!/usr/bin/env bash
# Dev local con API (auth + fichas). Reemplaza python http.server.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${1:-9876}"

if [[ -x "$ROOT/scripts/use-ledarpa-accounts.sh" ]]; then
  "$ROOT/scripts/use-ledarpa-accounts.sh" || true
fi

npx vercel env pull .env.local --yes >/dev/null
lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 0.2
echo "http://127.0.0.1:${PORT}"
exec npx vercel dev --listen "$PORT"
