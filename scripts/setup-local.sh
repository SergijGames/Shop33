#!/usr/bin/env bash
# Shop33 — local setup for macOS / Linux / WSL / Git Bash (Windows: scripts/setup-local.ps1).
# Installs deps, creates .env files from examples, starts Postgres in Docker,
# pushes the Prisma schema and seeds the admin + starter products.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Installing frontend dependencies"
npm install
echo "==> Installing server dependencies"
npm --prefix server install

[ -f .env ] || { cp .env.example .env; echo "Created .env"; }
if [ ! -f server/.env ]; then
  cp server/env.example server/.env
  secret="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  pass="$(node -e "console.log(require('crypto').randomBytes(9).toString('base64url'))")"
  sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=\"$secret\"|; s|^SEED_ADMIN_PASSWORD=.*|SEED_ADMIN_PASSWORD=\"$pass\"|" server/.env
  rm -f server/.env.bak
  echo "Created server/.env (admin: admin@example.com / $pass — change it in server/.env)"
fi

if command -v docker >/dev/null 2>&1; then
  echo "==> Starting Postgres (docker compose)"
  (cd server && docker compose up -d)
  echo "==> Waiting for Postgres"
  for _ in $(seq 1 30); do
    (cd server && docker compose exec -T postgres pg_isready -U shop33 >/dev/null 2>&1) && break
    sleep 1
  done
else
  echo "!! Docker not found. Set DATABASE_URL in server/.env to any Postgres (e.g. neon.tech) and re-run."
fi

echo "==> Prisma generate / db push / seed"
(cd server && npx prisma generate && npm run db:push && npm run seed)

echo ""
echo "Done. Start everything:  npm run dev:all"
echo "Shop:  http://localhost:5173/      Admin: http://localhost:5173/admin/login"
