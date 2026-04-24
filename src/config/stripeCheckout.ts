/**
 * Shop31 — клієнтський конфіг Stripe (увімкнення, publishable key, режими).
 * Оплата на сайті: Payment Element + PaymentIntent; сервер: server/index.mjs.
 * У .env кореня: VITE_STRIPE_CHECKOUT_ENABLED, VITE_STRIPE_PUBLISHABLE_KEY тощо.
 */
export function isStripeCheckoutEnabled(): boolean {
  return import.meta.env.VITE_STRIPE_CHECKOUT_ENABLED === 'true'
}

/** Публічний ключ Stripe для Elements (pk_test_... / pk_live_...). */
export function stripePublishableKey(): string {
  const k = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
  return typeof k === 'string' ? k.trim() : ''
}

/** Базовий URL API (порожньо = той самий origin, dev-проксі Vite на /api). */
export function stripeApiBase(): string {
  const raw = import.meta.env.VITE_PAYMENT_API_URL as string | undefined
  return typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
}

/** Повернення після 3D Secure тощо (Stripe додає query-параметри до URL). */
export function buildPaymentIntentReturnUrl(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  if (window.location.protocol === 'file:') {
    const href = window.location.href.split('#')[0]
    return `${href}#/order-thanks`
  }
  const o = window.location.origin
  return `${o}/order-thanks`
}

/** Для зовнішнього Stripe Checkout (редирект), якщо колись знадобиться. */
export function buildStripeReturnUrls(): { successUrl: string; cancelUrl: string } {
  if (typeof window === 'undefined') {
    return { successUrl: '', cancelUrl: '' }
  }
  if (window.location.protocol === 'file:') {
    const href = window.location.href.split('#')[0]
    return {
      successUrl: `${href}#/order-thanks?stripe_session={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${href}#/checkout`,
    }
  }
  const o = window.location.origin
  return {
    successUrl: `${o}/order-thanks?stripe_session={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${o}/checkout`,
  }
}
