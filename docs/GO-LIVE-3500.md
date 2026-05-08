## Shop31 — “$3500-ready” go-live checklist

Ціль: мати **живе демо** (вітрина + адмінка), з бекендом, БД, і підключеними оплатами (Stripe + LiqPay).

### 0) Підготувати репозиторій

1. Запушити код у GitHub (main).
2. Переконатися, що секрети не закомічені (`.env` має бути в `.gitignore`).

### 1) Deploy Backend + Postgres на Render (рекомендовано)

#### 1.1 Blueprint (найшвидше)

1. Render → **New** → **Blueprint**
2. Обери свій GitHub repo
3. Render прочитає `render.yaml` і створить:
   - `shop31-db` (Postgres)
   - `shop31-api` (Node Web Service)

#### 1.2 ENV в Render (обов’язково)

У `shop31-api` додай environment variables:
- `JWT_SECRET` = довгий випадковий рядок
- `SEED_ADMIN_EMAIL` = admin email
- `SEED_ADMIN_PASSWORD` = admin password
- `SEED_ADMIN_NAME` = `Administrator` (опційно)
- `STRIPE_SECRET_KEY` = `sk_live_...`
- `LIQPAY_PUBLIC_KEY` / `LIQPAY_PRIVATE_KEY`

Після деплою перевір: `https://<render-app>.onrender.com/api/health` → `ok:true`, `db:true`.

### 2) Frontend на GitHub Pages

1. Repo → **Settings → Pages → Source** → **GitHub Actions**
2. Repo → **Settings → Actions → General → Workflow permissions** → **Read and write permissions**

#### 2.1 Secrets для GitHub Actions (щоб фронт знав Render API)

Repo → **Settings → Secrets and variables → Actions → New repository secret**
- `VITE_API_BASE_URL` = `https://<render-app>.onrender.com`
- `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (опційно)
- `VITE_LIQPAY_ENABLED` = `true` (опційно)

Після пуша в main workflow задеплоїть сторінку:
`https://<owner>.github.io/<repo>/`

### 3) Stripe (live)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://<render-app>.onrender.com/api/stripe/webhook`
3. Events: `payment_intent.succeeded`
4. Додай `STRIPE_WEBHOOK_SECRET` у Render (якщо вмикаєш перевірку підпису).

### 4) LiqPay (live)

У LiqPay налаштуваннях:
- callback: `https://<render-app>.onrender.com/api/liqpay/callback`

### 5) Демонстрація покупцю (що показати)

- Вітрина: каталог, пошук, картка товару, кошик
- Адмінка: логін, “Товари” → **Опублікувати на сервер**
- Замовлення: оформлення + оплата (Stripe/LiqPay)
- `/api/health` як технічний proof

