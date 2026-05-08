/**
 * Shop31 — сервер оплати (Express + Stripe).
 * PaymentIntent для оплати на сайті; опційно Stripe Connect (STRIPE_CONNECTED_ACCOUNT_ID).
 * Зв’язки: фронт CheckoutPage / finalizeStripeDraft; змінні в server/.env
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Stripe from 'stripe'
import { z } from 'zod'
import prismaPkg from '@prisma/client'
const { PrismaClient } = prismaPkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const PORT = Number(process.env.PORT || 4242)
const secret = process.env.STRIPE_SECRET_KEY

const DATABASE_URL = (process.env.DATABASE_URL || '').trim()
const JWT_SECRET = (process.env.JWT_SECRET || '').trim()

if (!DATABASE_URL) {
  console.warn('[Shop31 api] DATABASE_URL не задано у server/.env (Postgres).')
}
if (!JWT_SECRET) {
  console.warn('[Shop31 api] JWT_SECRET не задано у server/.env (для токенів входу).')
}

if (!secret) {
  console.warn(
    '[Shop31 payment] STRIPE_SECRET_KEY не задано. Додайте ключ у server/.env (див. server/env.example).',
  )
}

const stripe = secret ? new Stripe(secret) : null
const prisma = DATABASE_URL ? new PrismaClient({ datasources: { db: { url: DATABASE_URL } } }) : null

/** Якщо задано (Stripe Connect, acct_...) — платіж створюється на підключеному акаунті: коші зараховуються на його баланс і виплачуються на його банк/карту в Dashboard. */
const STRIPE_CONNECTED_ACCOUNT_ID = (process.env.STRIPE_CONNECTED_ACCOUNT_ID || '').trim() || null

if (STRIPE_CONNECTED_ACCOUNT_ID && !STRIPE_CONNECTED_ACCOUNT_ID.startsWith('acct_')) {
  console.warn(
    '[Shop31 payment] STRIPE_CONNECTED_ACCOUNT_ID має починатися з acct_ (ід підключеного акаунту в Stripe Connect).',
  )
}

const stripeRequestOptions = STRIPE_CONNECTED_ACCOUNT_ID
  ? { stripeAccount: STRIPE_CONNECTED_ACCOUNT_ID }
  : undefined

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '512kb' }))
app.use(express.urlencoded({ extended: false }))

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 240,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
)

function requirePrisma(req, res) {
  if (!prisma) {
    res.status(503).json({ error: 'База даних не налаштована (немає DATABASE_URL).' })
    return null
  }
  return prisma
}

function issueToken(user) {
  if (!JWT_SECRET) return null
  const payload = { sub: user.id, role: user.role }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

function readAuth(req) {
  const h = req.headers.authorization
  if (!h || typeof h !== 'string') return null
  const m = h.match(/^Bearer\s+(.+)$/i)
  if (!m) return null
  const token = m[1]
  try {
    const data = jwt.verify(token, JWT_SECRET)
    if (!data || typeof data !== 'object') return null
    const sub = typeof data.sub === 'string' ? data.sub : null
    const role = data.role === 'admin' || data.role === 'user' ? data.role : null
    if (!sub || !role) return null
    return { userId: sub, role }
  } catch {
    return null
  }
}

function requireAuth(req, res) {
  const a = readAuth(req)
  if (!a) {
    res.status(401).json({ error: 'Потрібен вхід (Bearer token).' })
    return null
  }
  return a
}

function requireAdmin(req, res) {
  const a = requireAuth(req, res)
  if (!a) return null
  if (a.role !== 'admin') {
    res.status(403).json({ error: 'Доступ лише для адміністратора.' })
    return null
  }
  return a
}

// -------------------- LiqPay --------------------
const LIQPAY_PUBLIC_KEY = (process.env.LIQPAY_PUBLIC_KEY || '').trim()
const LIQPAY_PRIVATE_KEY = (process.env.LIQPAY_PRIVATE_KEY || '').trim()

// Дуже просте in-memory сховище статусів (демо). Після рестарту сервера очищається.
const liqpayStatusByOrderId = new Map()

function liqpaySignature(dataBase64) {
  const raw = `${LIQPAY_PRIVATE_KEY}${dataBase64}${LIQPAY_PRIVATE_KEY}`
  const sha1 = crypto.createHash('sha1').update(raw).digest('base64')
  return sha1
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    stripe: Boolean(stripe),
    db: Boolean(prisma),
    /** Платежі йдуть на баланс підключеного акаунту (виплата на його реквізити), а не лише на акаунт з secret key */
    stripeConnectedAccount: Boolean(STRIPE_CONNECTED_ACCOUNT_ID),
    liqpay: Boolean(LIQPAY_PUBLIC_KEY && LIQPAY_PRIVATE_KEY),
  })
})

// -------------------- Auth (email+пароль, JWT) --------------------
const SEED_ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase()
const SEED_ADMIN_PASSWORD = (process.env.SEED_ADMIN_PASSWORD || '').trim()
const SEED_ADMIN_NAME = (process.env.SEED_ADMIN_NAME || 'Administrator').trim()

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(256),
})

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(256),
})

app.post('/api/auth/register', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!JWT_SECRET) {
    return res.status(503).json({ error: 'JWT не налаштовано (немає JWT_SECRET).' })
  }

  const parsed = RegisterSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    return res.status(400).json({ error: 'Некоректні дані.', details: parsed.error.flatten() })
  }

  const { name, email, password } = parsed.data

  try {
    const exists = await p.user.findUnique({ where: { email } })
    if (exists) {
      return res.status(409).json({ error: 'Користувач з такою поштою вже існує.' })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await p.user.create({
      data: { email, name, passwordHash, role: 'user' },
      select: { id: true, email: true, name: true, role: true },
    })
    const token = issueToken(user)
    return res.json({ ok: true, token, user })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Помилка'
    return res.status(400).json({ error: message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!JWT_SECRET) {
    return res.status(503).json({ error: 'JWT не налаштовано (немає JWT_SECRET).' })
  }
  const parsed = LoginSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    return res.status(400).json({ error: 'Некоректні дані.', details: parsed.error.flatten() })
  }
  const { email, password } = parsed.data
  try {
    const found = await p.user.findUnique({ where: { email } })
    if (!found) return res.status(401).json({ error: 'Невірна пошта або пароль.' })
    const ok = await bcrypt.compare(password, found.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Невірна пошта або пароль.' })
    const user = { id: found.id, email: found.email, name: found.name, role: found.role }
    const token = issueToken(user)
    return res.json({ ok: true, token, user })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Помилка'
    return res.status(400).json({ error: message })
  }
})

app.get('/api/auth/me', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  const a = requireAuth(req, res)
  if (!a) return
  const user = await p.user.findUnique({
    where: { id: a.userId },
    select: { id: true, email: true, name: true, role: true },
  })
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено.' })
  return res.json({ ok: true, user })
})

// -------------------- Public catalog API --------------------
app.get('/api/catalog/categories', async (_req, res) => {
  const p = requirePrisma(_req, res)
  if (!p) return
  const cats = await p.category.findMany({
    orderBy: [{ sort: 'asc' }, { labelUk: 'asc' }],
    select: { id: true, slug: true, labelUk: true, labelEn: true, sort: true },
  })
  return res.json({ ok: true, categories: cats })
})

app.get('/api/catalog/products', async (_req, res) => {
  const p = requirePrisma(_req, res)
  if (!p) return
  const rows = await p.product.findMany({ orderBy: [{ updatedAt: 'desc' }] })
  return res.json({ ok: true, products: rows.map((r) => r.data) })
})

app.get('/api/catalog/products/:slug', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  const slug = String(req.params.slug || '').trim()
  if (!slug) return res.status(400).json({ error: 'Потрібен slug.' })
  const row = await p.product.findUnique({ where: { id: slug } })
  if (!row) return res.status(404).json({ error: 'Товар не знайдено.' })
  return res.json({ ok: true, product: row.data })
})

// -------------------- Admin API --------------------
const CategoryUpsertSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  labelUk: z.string().trim().min(1).max(120),
  labelEn: z.string().trim().min(1).max(120),
  sort: z.number().int().min(-9999).max(9999).optional(),
})

const ProductJsonSchema = z.object({
  id: z.string().trim().min(1).max(180),
  name: z.string().trim().min(1).max(400),
  spec: z.string().trim().max(400).optional(),
  priceUah: z.number().int().min(0).max(10_000_000),
  oldPriceUah: z.number().int().min(0).max(10_000_000).nullable(),
  tag: z.string().trim().min(1).max(120),
  image: z.string().trim().min(1).max(2000),
  categoryId: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(50_000),
  gallery: z.array(z.string().trim().min(1).max(2000)).min(1).max(60),
  videos: z.array(z.object({ title: z.string().trim().min(1).max(300), youtubeId: z.string().trim().min(1).max(64) })),
  specsTable: z.array(z.object({ label: z.string().trim().min(1).max(200), value: z.string().trim().min(1).max(2000) })),
  reviews: z.array(
    z.object({
      author: z.string().trim().min(1).max(120),
      rating: z.number().int().min(1).max(5),
      date: z.string().trim().min(4).max(40),
      text: z.string().trim().min(1).max(4000),
    }),
  ),
})

app.get('/api/admin/categories', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return
  const cats = await p.category.findMany({ orderBy: [{ sort: 'asc' }, { labelUk: 'asc' }] })
  return res.json({ ok: true, categories: cats })
})

app.post('/api/admin/categories', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return
  const parsed = CategoryUpsertSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    return res.status(400).json({ error: 'Некоректні дані.', details: parsed.error.flatten() })
  }
  try {
    const created = await p.category.create({ data: { ...parsed.data, sort: parsed.data.sort ?? 0 } })
    return res.json({ ok: true, category: created })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Помилка' })
  }
})

app.put('/api/admin/categories/:id', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return
  const id = String(req.params.id || '').trim()
  const parsed = CategoryUpsertSchema.safeParse(req.body ?? {})
  if (!id) return res.status(400).json({ error: 'Потрібен id.' })
  if (!parsed.success) {
    return res.status(400).json({ error: 'Некоректні дані.', details: parsed.error.flatten() })
  }
  try {
    const updated = await p.category.update({ where: { id }, data: { ...parsed.data, sort: parsed.data.sort ?? 0 } })
    return res.json({ ok: true, category: updated })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Помилка' })
  }
})

app.delete('/api/admin/categories/:id', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return
  const id = String(req.params.id || '').trim()
  if (!id) return res.status(400).json({ error: 'Потрібен id.' })
  try {
    await p.category.delete({ where: { id } })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Помилка' })
  }
})

app.get('/api/admin/users', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return

  const users = await p.user.findMany({
    orderBy: [{ createdAt: 'desc' }],
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })
  return res.json({ ok: true, users })
})

app.delete('/api/admin/users/:email', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return

  const email = String(req.params.email || '')
    .trim()
    .toLowerCase()
  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) return res.status(400).json({ error: 'Некоректна пошта.' })

  try {
    const found = await p.user.findUnique({ where: { email: parsed.data } })
    if (!found) return res.status(404).json({ error: 'Користувача не знайдено.' })
    if (found.role === 'admin') {
      return res.status(403).json({ error: 'Неможливо видалити обліковий запис адміністратора.' })
    }
    await p.user.delete({ where: { email: parsed.data } })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Помилка' })
  }
})

app.get('/api/admin/products', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return
  const rows = await p.product.findMany({ orderBy: [{ updatedAt: 'desc' }] })
  return res.json({ ok: true, products: rows.map((r) => r.data) })
})

app.post('/api/admin/products', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return
  const parsed = ProductJsonSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    return res.status(400).json({ error: 'Некоректні дані.', details: parsed.error.flatten() })
  }
  try {
    const created = await p.product.create({ data: { id: parsed.data.id, data: parsed.data } })
    return res.json({ ok: true, product: created.data })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Помилка' })
  }
})

app.post('/api/admin/products/bulk-upsert', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return

  const BodySchema = z.object({ products: z.array(ProductJsonSchema).min(1).max(500) })
  const parsed = BodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    return res.status(400).json({ error: 'Некоректні дані.', details: parsed.error.flatten() })
  }

  try {
    await p.$transaction(
      parsed.data.products.map((prod) =>
        p.product.upsert({
          where: { id: prod.id },
          create: { id: prod.id, data: prod },
          update: { data: prod },
        }),
      ),
    )
    return res.json({ ok: true, count: parsed.data.products.length })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Помилка' })
  }
})

app.put('/api/admin/products/:id', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return
  const id = String(req.params.id || '').trim()
  if (!id) return res.status(400).json({ error: 'Потрібен id.' })
  const parsed = ProductJsonSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    return res.status(400).json({ error: 'Некоректні дані.', details: parsed.error.flatten() })
  }
  try {
    const updated = await p.product.update({ where: { id }, data: { id, data: parsed.data } })
    return res.json({ ok: true, product: updated.data })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Помилка' })
  }
})

app.delete('/api/admin/products/:id', async (req, res) => {
  const p = requirePrisma(req, res)
  if (!p) return
  if (!requireAdmin(req, res)) return
  const id = String(req.params.id || '').trim()
  if (!id) return res.status(400).json({ error: 'Потрібен id.' })
  try {
    await p.product.delete({ where: { id } })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Помилка' })
  }
})

app.post('/api/liqpay/create-checkout', async (req, res) => {
  if (!LIQPAY_PUBLIC_KEY || !LIQPAY_PRIVATE_KEY) {
    return res.status(503).json({ error: 'LiqPay не налаштовано (потрібні LIQPAY_PUBLIC_KEY та LIQPAY_PRIVATE_KEY у server/.env).' })
  }
  try {
    const { amountUah, orderId, description, resultUrl, serverUrl } = req.body ?? {}
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'Потрібен orderId.' })
    }
    const amount = Number(amountUah)
    if (!Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ error: 'Сума має бути не менше 1 ₴.' })
    }
    if (!resultUrl || typeof resultUrl !== 'string') {
      return res.status(400).json({ error: 'Потрібен resultUrl.' })
    }
    if (!serverUrl || typeof serverUrl !== 'string') {
      return res.status(400).json({ error: 'Потрібен serverUrl.' })
    }

    const payload = {
      public_key: LIQPAY_PUBLIC_KEY,
      version: '3',
      action: 'pay',
      amount: Number(amount.toFixed(2)),
      currency: 'UAH',
      description: typeof description === 'string' && description.trim() ? description.trim().slice(0, 250) : 'Shop31 — замовлення',
      order_id: orderId.slice(0, 255),
      result_url: resultUrl,
      server_url: serverUrl,
      // sandbox: '1', // за потреби для тестів у LiqPay
    }

    const dataBase64 = Buffer.from(JSON.stringify(payload)).toString('base64')
    const signature = liqpaySignature(dataBase64)
    return res.json({
      url: 'https://www.liqpay.ua/api/3/checkout',
      data: dataBase64,
      signature,
      orderId: payload.order_id,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Помилка LiqPay'
    return res.status(400).json({ error: message })
  }
})

app.post('/api/liqpay/callback', async (req, res) => {
  if (!LIQPAY_PUBLIC_KEY || !LIQPAY_PRIVATE_KEY) {
    return res.status(503).send('LiqPay not configured')
  }

  // LiqPay надсилає form-urlencoded: data=...&signature=...
  const data = req.body?.data
  const signature = req.body?.signature
  if (!data || typeof data !== 'string' || !signature || typeof signature !== 'string') {
    return res.status(400).send('Bad callback')
  }

  const expected = liqpaySignature(data)
  if (expected !== signature) {
    return res.status(400).send('Bad signature')
  }

  try {
    const json = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))
    const orderId = typeof json?.order_id === 'string' ? json.order_id : ''
    const status = typeof json?.status === 'string' ? json.status : ''
    const paymentId = typeof json?.payment_id === 'string' || typeof json?.payment_id === 'number' ? String(json.payment_id) : ''
    if (orderId) {
      liqpayStatusByOrderId.set(orderId, {
        status,
        paymentId,
        receivedAt: new Date().toISOString(),
        raw: json,
      })
    }
  } catch {
    // ignore parse errors; signature already verified
  }

  // LiqPay очікує 200 OK
  return res.json({ ok: true })
})

app.get('/api/liqpay/order-status', async (req, res) => {
  const orderId = req.query.order_id
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'Потрібен order_id.' })
  }
  const s = liqpayStatusByOrderId.get(orderId)
  return res.json({
    ok: true,
    orderId,
    status: s?.status ?? null,
    paymentId: s?.paymentId ?? null,
    receivedAt: s?.receivedAt ?? null,
  })
})

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Платежі Stripe не налаштовані (немає STRIPE_SECRET_KEY).' })
  }

  try {
    const {
      amountUah,
      clientReferenceId,
      customerEmail,
      successUrl,
      cancelUrl,
    } = req.body ?? {}

    if (!clientReferenceId || typeof clientReferenceId !== 'string') {
      return res.status(400).json({ error: 'Потрібен clientReferenceId.' })
    }
    if (!successUrl || typeof successUrl !== 'string' || !successUrl.includes('{CHECKOUT_SESSION_ID}')) {
      return res.status(400).json({ error: 'successUrl має містити {CHECKOUT_SESSION_ID}.' })
    }
    if (!cancelUrl || typeof cancelUrl !== 'string') {
      return res.status(400).json({ error: 'Потрібен cancelUrl.' })
    }

    const amount = Number(amountUah)
    if (!Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ error: 'Сума має бути не менше 1 ₴.' })
    }

    /** UAH: unit_amount у копійках */
    const unitAmount = Math.round(amount * 100)
    if (unitAmount < 100) {
      return res.status(400).json({ error: 'Занадто мала сума для оплати.' })
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'uah',
              unit_amount: unitAmount,
              product_data: {
                name: 'Shop31 — замовлення',
                description: 'Оплата замовлення в інтернет-магазині',
              },
            },
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: clientReferenceId.slice(0, 200),
        customer_email:
          typeof customerEmail === 'string' && customerEmail.includes('@')
            ? customerEmail.slice(0, 320)
            : undefined,
        metadata: {
          app: 'shop31',
        },
      },
      stripeRequestOptions,
    )

    if (!session.url) {
      return res.status(500).json({ error: 'Stripe не повернув URL сесії.' })
    }

    return res.json({ url: session.url, id: session.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Помилка Stripe'
    return res.status(400).json({ error: message })
  }
})

app.post('/api/stripe/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Платежі Stripe не налаштовані (немає STRIPE_SECRET_KEY).' })
  }

  try {
    const { amountUah, clientReferenceId, customerEmail, orderDraft } = req.body ?? {}

    if (!clientReferenceId || typeof clientReferenceId !== 'string') {
      return res.status(400).json({ error: 'Потрібен clientReferenceId.' })
    }

    const amount = Number(amountUah)
    if (!Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ error: 'Сума має бути не менше 1 ₴.' })
    }

    const unitAmount = Math.round(amount * 100)
    if (unitAmount < 100) {
      return res.status(400).json({ error: 'Занадто мала сума для оплати.' })
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: unitAmount,
        currency: 'uah',
        automatic_payment_methods: { enabled: true },
        metadata: {
          app: 'shop31',
          client_reference_id: clientReferenceId.slice(0, 500),
        },
        receipt_email:
          typeof customerEmail === 'string' && customerEmail.includes('@')
            ? customerEmail.slice(0, 320)
            : undefined,
      },
      stripeRequestOptions,
    )

    if (!paymentIntent.client_secret) {
      return res.status(500).json({ error: 'Stripe не повернув client_secret.' })
    }

    // Якщо БД налаштована — запишемо/оновимо замовлення як pending_payment.
    if (prisma) {
      const DraftSchema = z
        .object({
          customerName: z.string().trim().min(2).max(120),
          phone: z.string().trim().min(6).max(40),
          city: z.string().trim().min(2).max(160),
          comment: z.string().trim().max(2000).optional().default(''),
          subtotalUah: z.number().int().min(0).max(10_000_000).optional(),
          totalUah: z.number().int().min(1).max(10_000_000),
          lines: z
            .array(
              z.object({
                productId: z.string().trim().min(1).max(180),
                name: z.string().trim().min(1).max(400),
                priceUah: z.number().int().min(0).max(10_000_000),
                qty: z.number().int().min(1).max(999),
              }),
            )
            .min(1)
            .max(300),
        })
        .optional()

      const dParsed = DraftSchema.safeParse(orderDraft)
      const d = dParsed.success ? dParsed.data : undefined

      await prisma.order.upsert({
        where: { id: clientReferenceId },
        create: {
          id: clientReferenceId,
          customerName: d?.customerName ?? 'Покупець',
          phone: d?.phone ?? '',
          city: d?.city ?? '',
          comment: d?.comment ?? '',
          subtotalUah: d?.subtotalUah,
          totalUah: d?.totalUah ?? amount,
          paymentMethod: 'stripe',
          status: 'pending_payment',
          stripePaymentIntentId: paymentIntent.id,
          customerEmail:
            typeof customerEmail === 'string' && customerEmail.includes('@')
              ? customerEmail.slice(0, 320)
              : undefined,
          lines: d
            ? {
                create: d.lines.map((l) => ({
                  productId: l.productId,
                  name: l.name,
                  priceUah: l.priceUah,
                  qty: l.qty,
                })),
              }
            : undefined,
        },
        update: {
          status: 'pending_payment',
          paymentMethod: 'stripe',
          stripePaymentIntentId: paymentIntent.id,
          ...(d
            ? {
                customerName: d.customerName,
                phone: d.phone,
                city: d.city,
                comment: d.comment,
                subtotalUah: d.subtotalUah,
                totalUah: d.totalUah,
                lines: {
                  deleteMany: {},
                  create: d.lines.map((l) => ({
                    productId: l.productId,
                    name: l.name,
                    priceUah: l.priceUah,
                    qty: l.qty,
                  })),
                },
              }
            : {}),
        },
      })
    }

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Помилка Stripe'
    return res.status(400).json({ error: message })
  }
})

// Stripe webhook (оновлення статусів замовлень у БД).
// Для продакшену додайте STRIPE_WEBHOOK_SECRET і перевірку підпису.
app.post('/api/stripe/webhook', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'DB not configured' })
  const evt = req.body
  if (!evt || typeof evt !== 'object') return res.status(400).json({ error: 'Bad event' })

  const type = evt.type
  if (type === 'payment_intent.succeeded') {
    const obj = evt.data?.object
    const piId = typeof obj?.id === 'string' ? obj.id : ''
    if (piId) {
      await prisma.order.updateMany({
        where: { stripePaymentIntentId: piId },
        data: { status: 'paid' },
      })
    }
  }
  return res.json({ ok: true })
})

app.get('/api/stripe/payment-intent-status', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe не налаштовано.' })
  }
  const id = req.query.payment_intent_id
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Потрібен payment_intent_id.' })
  }
  try {
    const pi = await stripe.paymentIntents.retrieve(id, stripeRequestOptions)
    return res.json({
      status: pi.status,
      clientReferenceId: pi.metadata?.client_reference_id ?? null,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Помилка'
    return res.status(400).json({ error: message })
  }
})

app.get('/api/stripe/session-status', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe не налаштовано.' })
  }
  const sessionId = req.query.session_id
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Потрібен session_id.' })
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, stripeRequestOptions)
    return res.json({
      paymentStatus: session.payment_status,
      clientReferenceId: session.client_reference_id ?? null,
      amountTotal: session.amount_total,
      currency: session.currency,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Помилка'
    return res.status(400).json({ error: message })
  }
})

app.listen(PORT, () => {
  console.log(`[Shop31 payment] http://127.0.0.1:${PORT}`)
  if (STRIPE_CONNECTED_ACCOUNT_ID) {
    console.log(
      `[Shop31 payment] Коші зараховуються на Connect-акаунт ${STRIPE_CONNECTED_ACCOUNT_ID} (його виплати в Dashboard).`,
    )
  }

  if (prisma && SEED_ADMIN_EMAIL && SEED_ADMIN_PASSWORD) {
    void (async () => {
      try {
        const exists = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } })
        if (exists) return
        const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12)
        await prisma.user.create({
          data: {
            email: SEED_ADMIN_EMAIL,
            name: SEED_ADMIN_NAME || 'Administrator',
            passwordHash,
            role: 'admin',
          },
        })
        console.log(`[Shop31 api] Seed admin створено: ${SEED_ADMIN_EMAIL}`)
      } catch (e) {
        console.warn('[Shop31 api] Не вдалося створити seed admin:', e instanceof Error ? e.message : String(e))
      }
    })()
  }
})
