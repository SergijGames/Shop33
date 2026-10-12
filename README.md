# Shop33 — React + Node e-commerce starter (Stripe + LiqPay)

A complete, bilingual (Ukrainian / English) online store: a fast React storefront, an admin panel,
and a Node/Express + PostgreSQL API with Stripe and LiqPay payments.

**Live demo (frontend):** https://sergijgames.github.io/Shop33/

> The GitHub Pages demo is static. Login, admin, orders and payments need the API (see *Deploy*).

<!-- Screenshots: put images in docs/screenshots/ and uncomment -->
<!-- ![Home](docs/screenshots/home.png) -->
<!-- ![Product](docs/screenshots/product.png) -->
<!-- ![Checkout](docs/screenshots/checkout.png) -->
<!-- ![Admin](docs/screenshots/admin.png) -->

## Features

**Storefront**
- Home page with hero and best-sellers, catalog by categories and custom collections
- Product pages with images and reviews
- Search with tokens, synonyms and UK/EN category names
- Favorites and cart (persisted in the browser)
- Checkout: pay without card (order only), **Stripe** card payment, **LiqPay**
- Registration / login (JWT), user account, order history, bonus points
- Optional emails (registration, order confirmation) via EmailJS
- UI in Ukrainian and English, prices formatted in UAH
- Neon-themed responsive design

**Admin panel** (`/admin/login`)
- Dashboard with stats
- Products: create / edit / delete, publish the built-in catalog to the database
- Categories management, personal collections for users
- Orders, users (incl. bonus balance), search presets

**API** (`server/`)
- Express + Prisma (PostgreSQL): users, roles, categories, products, orders
- bcrypt passwords, JWT auth, rate limiting, zod validation
- Stripe (Payment Intents / Checkout Session, optional Stripe Connect) and LiqPay (checkout + callback)
- `GET /api/health` health check

## Tech stack

| Part | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, React Router 7, Stripe.js |
| Backend | Node.js 20+, Express 4, Prisma 6, PostgreSQL 16 |
| Payments | Stripe, LiqPay |
| Deploy | GitHub Pages (GitHub Actions) + Render (`render.yaml` blueprint) |

## Quick start

Requirements: Node.js 20+, npm, Docker (for local Postgres) — or any Postgres URL.

```bash
# macOS / Linux / WSL / Git Bash
npm run setup:local
# Windows PowerShell
npm run setup:local:win

npm run dev:all
```

`setup:local` installs dependencies, creates `.env` and `server/.env` from the examples
(with a random `JWT_SECRET` and admin password), starts Postgres in Docker, pushes the schema
and seeds the admin and starter products.

- Shop: http://localhost:5173/
- Admin: http://localhost:5173/admin/login (credentials from `server/.env`)
- API: http://127.0.0.1:4242/api/health

Manual setup:

```bash
npm install && npm --prefix server install
cp .env.example .env && cp server/env.example server/.env   # then edit server/.env
(cd server && docker compose up -d)
npm run db:setup
npm run dev:all
```

Useful scripts: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (API smoke test), `npm run check` (all).

## Environment variables

Frontend (`.env`, public values only — they are embedded in the bundle):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API URL in production, e.g. `https://your-api.onrender.com` |
| `VITE_STRIPE_CHECKOUT_ENABLED` | `true` to show Stripe payment |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` / `pk_live_...` |
| `VITE_LIQPAY_ENABLED` | `true` to show LiqPay |
| `VITE_EMAILJS_*` | optional EmailJS keys/templates |

Backend (`server/.env`, secrets — never commit):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required) |
| `JWT_SECRET` | long random string (required) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | admin account created on start/seed |
| `STRIPE_SECRET_KEY` | `sk_test_...` (optional) |
| `STRIPE_CONNECTED_ACCOUNT_ID` | optional Stripe Connect `acct_...` |
| `LIQPAY_PUBLIC_KEY` / `LIQPAY_PRIVATE_KEY` | optional LiqPay keys |
| `PORT` | default `4242` |

## Deploy

**Backend + DB on Render:** Render → New → Blueprint → select the repo. `render.yaml` creates
`shop33-db` (Postgres) and `shop33-api` (Node). Set `JWT_SECRET`, `SEED_ADMIN_*`, Stripe/LiqPay keys
in the Render dashboard. Check `https://<app>.onrender.com/api/health`.

**Frontend on GitHub Pages:** Settings → Pages → Source = *GitHub Actions*. Add repository secrets
`VITE_API_BASE_URL` (and optionally `VITE_STRIPE_CHECKOUT_ENABLED`, `VITE_STRIPE_PUBLISHABLE_KEY`,
`VITE_LIQPAY_ENABLED`). Every push to `main` runs `.github/workflows/deploy-github-pages.yml`.

Then log in to the admin and press **Publish products to server** so the storefront serves the catalog from the API.

Details: [docs/GO-LIVE-CHECKLIST.md](docs/GO-LIVE-CHECKLIST.md), [docs/SALE-DEPLOY.md](docs/SALE-DEPLOY.md),
[docs/СТРУКТУРА-ПРОЄКТУ.md](docs/СТРУКТУРА-ПРОЄКТУ.md).

## Payments in test mode

- **Stripe:** use `sk_test_...` / `pk_test_...` keys and test card `4242 4242 4242 4242`, any future date, any CVC.
  Webhook endpoint: `/api/stripe/webhook` (event `payment_intent.succeeded`). Note: webhook signature
  verification is not implemented yet — add `STRIPE_WEBHOOK_SECRET` verification before going live.
- **LiqPay:** use sandbox keys from the LiqPay cabinet; for sandbox payments uncomment `sandbox: '1'`
  in `server/index.mjs`. Callback: `/api/liqpay/callback`.

## License

MIT — see [LICENSE](LICENSE).

---

## 🇺🇦 Українською

**Shop33** — готовий двомовний (UA/EN) інтернет-магазин: вітрина на React 19 + TypeScript + Vite,
адмін-панель і API на Node.js/Express + Prisma + PostgreSQL з оплатою **Stripe** та **LiqPay**.

**Демо:** https://sergijgames.github.io/Shop33/

**Можливості:** каталог і категорії, пошук із синонімами, картка товару з відгуками, обране, кошик,
оформлення замовлення (без картки / Stripe / LiqPay), реєстрація та вхід (JWT), кабінет з історією
замовлень і бонусами, листи через EmailJS. Адмінка: статистика, товари, категорії, підбірки для
користувачів, замовлення, користувачі, пресети пошуку.

**Швидкий старт:**

```bash
npm run setup:local        # macOS / Linux / Git Bash
npm run setup:local:win    # Windows PowerShell
npm run dev:all
```

Магазин — http://localhost:5173/, адмінка — `/admin/login` (логін/пароль із `server/.env`).

**Деплой:** бекенд і база — Render (Blueprint з `render.yaml`), фронтенд — GitHub Pages
(секрет `VITE_API_BASE_URL`). Покрокова інструкція: `docs/GO-LIVE-CHECKLIST.md`.

**Оплати в тестовому режимі:** тестові ключі Stripe (`sk_test_`/`pk_test_`, картка `4242 4242 4242 4242`)
та sandbox-ключі LiqPay.

Ліцензія — MIT.
