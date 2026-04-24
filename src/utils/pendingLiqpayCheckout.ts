/**
 * Shop31 — чернетка замовлення в sessionStorage для LiqPay (перед редіректом на оплату).
 * Зв’язки: CheckoutPage, OrderThanksPage, finalizeLiqpayDraft.ts
 */
import type { OrderLine } from '../shop/ordersStorage'

export const PENDING_LIQPAY_STORAGE_PREFIX = 'shop31_pending_liqpay_'

export function pendingLiqpayStorageKey(orderId: string): string {
  return `${PENDING_LIQPAY_STORAGE_PREFIX}${orderId}`
}

export type PendingLiqpayDraftV1 = {
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
  userEmail?: string
}

