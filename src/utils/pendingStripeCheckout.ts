/**
 * Shop31 — чернетка замовлення в sessionStorage під час оплати Stripe.
 * Зв’язки: CheckoutPage, OrderThanksPage, finalizeStripeDraft.ts
 */
import type { OrderLine } from '../shop/ordersStorage'

export const PENDING_STRIPE_STORAGE_PREFIX = 'shop31_pending_stripe_'

/** Чернетка замовлення перед редіректом у Stripe Checkout. */
export type PendingStripeDraftV1 = {
  v: 1
  orderId: string
  customerName: string
  phone: string
  city: string
  comment: string
  lines: OrderLine[]
  subtotalUah: number
  totalUah: number
  bonusSpend: number
  bonusEarned: number
  /** Email для списання/нарахування бонусів після успішної оплати. */
  userEmail?: string
}

export function pendingStripeStorageKey(orderId: string): string {
  return `${PENDING_STRIPE_STORAGE_PREFIX}${orderId}`
}
