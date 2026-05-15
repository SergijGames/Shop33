# Shop31 — локальна база без prisma dev (потрібен Docker Desktop).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$server = Join-Path $root 'server'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host 'Docker не знайдено. Встановіть Docker Desktop: https://www.docker.com/products/docker-desktop/'
  Write-Host 'Або отримайте DATABASE_URL з https://neon.tech і додайте в server/.env'
  exit 1
}

Set-Location $server
docker compose up -d
Write-Host ''
Write-Host 'Додайте в server/.env (якщо ще немає):'
Write-Host 'DATABASE_URL="postgresql://shop31:shop31@127.0.0.1:5432/shop31?schema=public"'
Write-Host ''
npm run db:push
npm run seed
Write-Host ''
Write-Host 'Готово. Запуск: cd .. ; npm run dev:all'
Write-Host 'Адмінка: http://localhost:5173/admin/login'
