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
import Stripe from 'stripe'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const PORT = Number(process.env.PORT || 4242)
const secret = process.env.STRIPE_SECRET_KEY

if (!secret) {
  console.warn(
    '[Shop31 payment] STRIPE_SECRET_KEY не задано. Додайте ключ у server/.env (див. server/env.example).',
  )
}

const stripe = secret ? new Stripe(secret) : null

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
    /** Платежі йдуть на баланс підключеного акаунту (виплата на його реквізити), а не лише на акаунт з secret key */
    stripeConnectedAccount: Boolean(STRIPE_CONNECTED_ACCOUNT_ID),
    liqpay: Boolean(LIQPAY_PUBLIC_KEY && LIQPAY_PRIVATE_KEY),
  })
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
    const { amountUah, clientReferenceId, customerEmail } = req.body ?? {}

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

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Помилка Stripe'
    return res.status(400).json({ error: message })
  }
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
})
