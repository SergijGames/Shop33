# Shop31 — інтернет‑магазин (sale‑ready)

Цей репозиторій містить:
- **Frontend**: Vite + React (`/src`)
- **Backend API**: Node/Express + Postgres (Prisma) (`/server`)

## Швидкий старт (для демо/клієнта)

### 1) Встановити залежності

```bash
npm install
cd server && npm install
```

### 2) Запустити локальну базу (Prisma Postgres)

```bash
cd server
npx prisma dev --name shop31
```

Скопіюй `DATABASE_URL` який виведе команда у `server/.env`.

Далі застосуй схему:

```bash
npm run db:push
```

### 3) Налаштувати `server/.env`

Візьми шаблон `server/env.example` і додай мінімум:
- `DATABASE_URL=...`
- `JWT_SECRET=...`
- `SEED_ADMIN_EMAIL=...`
- `SEED_ADMIN_PASSWORD=...`

### 4) Запустити сайт + API однією командою

У корені проєкту:

```bash
npm run dev:all
```

Frontend: `http://localhost:5173/`  
API: `http://127.0.0.1:4242/api/health`

## Як “опублікувати” товари в базу (щоб не було демо)

1) Увійди як admin (через `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)
2) Відкрий **Admin → Товари**
3) Натисни **“Опублікувати товари на сервер”**

Після цього вітрина буде брати товари з API.

## Деплой (коротко)

- **Frontend**: будь‑який static host (Vercel/Netlify/Cloudflare Pages/GitHub Pages)
- **Backend + Postgres**: Render/Fly/Railway/VPS

Докладно: `docs/СТРУКТУРА-ПРОЄКТУ.md` та `docs/SALE-DEPLOY.md`

### GitHub Pages (frontend)

1. Закоміть і запуште код у гілку `main` (або `master`) — у репозиторії вже є workflow `.github/workflows/deploy-github-pages.yml`.
2. На GitHub: **Settings → Pages → Build and deployment → Source** виберіть **GitHub Actions** (не “Deploy from a branch”).
3. **Settings → Actions → General → Workflow permissions** — увімкніть **Read and write** (і дозвіл на створення env для Pages, якщо GitHub запропонує).
4. У **Settings → Secrets and variables → Actions** додайте секрети (якщо потрібен робочий магазин з API):
   - `VITE_API_BASE_URL` — повний URL вашого API (наприклад `https://your-api.onrender.com`)
   - за потреби: `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_LIQPAY_ENABLED`
5. Після успішного workflow сайт буде за адресою: `https://<ваш-нік>.github.io/<назва-репозиторію>/`

**Важливо:** GitHub Pages хостить лише **статичний frontend**. База, логіни, Stripe/LiqPay — це ваш **окремий сервер** (наприклад Render), який ви вказуєте в `VITE_API_BASE_URL`.
