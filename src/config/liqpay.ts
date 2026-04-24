/**
 * Shop31 — клієнтський конфіг LiqPay (вмикач, базовий URL API).
 * Сервер підписує data/signature: server/index.mjs.
 * У .env кореня: VITE_LIQPAY_ENABLED=true, VITE_PAYMENT_API_URL (якщо API на іншому домені).
 */
export function isLiqpayEnabled(): boolean {
  return import.meta.env.VITE_LIQPAY_ENABLED === 'true'
}

/** Базовий URL API (порожньо = той самий origin, dev-проксі Vite на /api). */
export function paymentApiBase(): string {
  const raw = import.meta.env.VITE_PAYMENT_API_URL as string | undefined
  return typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
}

/** URL повернення після оплати (LiqPay редіректить на result_url). */
export function buildLiqpayReturnUrl(orderId: string): string {
  if (typeof window === 'undefined') return ''
  const encoded = encodeURIComponent(orderId)
  if (window.location.protocol === 'file:') {
    const href = window.location.href.split('#')[0]
    return `${href}#/order-thanks?liqpay_order=${encoded}`
  }
  return `${window.location.origin}/order-thanks?liqpay_order=${encoded}`
}

/** URL callback на сервер (LiqPay шле status + signature). */
export function buildLiqpayServerCallbackUrl(): string {
  if (typeof window === 'undefined') return ''
  const base = paymentApiBase()
  // якщо base пустий — це той самий origin; у dev його проксіть Vite.
  return `${base}/api/liqpay/callback`
}

