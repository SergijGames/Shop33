## Shop31 — деплой для продажу ($5000 пакет)

Ціль: дати клієнту **1 посилання на магазин** + **1 посилання на адмінку** + стабільну оплату/замовлення.

### Варіант A (рекомендовано): Frontend на Vercel/Netlify, Backend+DB на Render/Railway

#### 1) Backend (Render / Railway)

1. Створи Postgres (Render/Railway) і отримай `DATABASE_URL`.
2. Додай сервіс **Node** для `server/` (root dir: `server`).
3. Environment variables (у хості, не в git):
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `SEED_ADMIN_EMAIL`
   - `SEED_ADMIN_PASSWORD`
   - `SEED_ADMIN_NAME` (опційно)
   - `STRIPE_SECRET_KEY` (якщо Stripe вмикаємо)
   - `LIQPAY_PUBLIC_KEY`, `LIQPAY_PRIVATE_KEY` (якщо LiqPay вмикаємо)
4. Build/Start:
   - install: `npm ci`
   - start: `npm run start`
5. Один раз застосуй схему БД:
   - `npx prisma db push` (локально з тим самим `DATABASE_URL`)

Після цього перевір: `GET /api/health` → `db: true`.

#### 2) Frontend (Vercel / Netlify)

1. Деплой root проєкту.
2. Env:
   - `VITE_API_BASE_URL` = `https://<your-api-host>`
   - (опційно) `VITE_STRIPE_PUBLISHABLE_KEY`
   - (опційно) `VITE_LIQPAY_ENABLED=true`
3. Build: `npm run build`

#### 3) Перший запуск магазину (щоб не демо)

1. Зайди на `https://<site>/admin/login`
2. Увійди seed‑адміном.
3. Admin → Товари → **“Опублікувати товари на сервер”**

### Варіант B: VPS (один сервер) + Postgres

Мінімально:
- Nginx: `/` → static frontend, `/api` → backend (порт 4242)
- Postgres на тому ж VPS або окремо

### Чеклист “готово до продажу”

- [ ] `https://site/` працює
- [ ] `https://site/admin/login` працює
- [ ] Товари віддаються з API (`/api/catalog/products`)
- [ ] Реєстрація/логін працюють
- [ ] Замовлення пишуться в БД
- [ ] Stripe webhook виставляє `paid`

