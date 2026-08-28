#!/usr/bin/env bash
# Activa cuentas personales (ledarpa) para este repo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Git (local) =="
git config --local user.name "ledarpa"
git config --local user.email "ledarpa@gmail.com"
echo "user: $(git config --local user.name) <$(git config --local user.email)>"
echo "origin: $(git config --local --get remote.origin.url)"

echo "== GitHub CLI =="
if command -v gh >/dev/null 2>&1; then
  gh auth switch --user ledarpa >/dev/null
  gh auth status 2>&1 | sed -n '1,12p'
else
  echo "gh no instalado"
fi

echo "== Vercel =="
if command -v npx >/dev/null 2>&1; then
  WHO="$(npx vercel whoami 2>/dev/null || true)"
  echo "whoami: ${WHO:-?}"
  if [[ -f .vercel/project.json ]]; then
    echo "linked: $(cat .vercel/project.json)"
  fi
  if [[ "$WHO" != "ledarpa" ]]; then
    echo "AVISO: Vercel CLI no es ledarpa. Corré: npx vercel login  (ledarpa@gmail.com)"
    exit 1
  fi
fi

echo "OK cuentas personales activas para cyberpunk-pbta."
