/**
 * Shop31 — фіналізація замовлення після оплати LiqPay: бонуси + запис у orders.
 * Статус оплати перевіряється через server API (/api/liqpay/order-status).
 * Зв’язки: OrderThanksPage, pendingLiqpayCheckout, bonusStorage, ordersStorage, customerEmailFlow
 */
import { addBonus, getBonusBalance, spendBonus } from '../shop/bonusStorage'
import { appendOrder, getOrderById, readOrders } from '../shop/ordersStorage'
import { pendingLiqpayStorageKey, type PendingLiqpayDraftV1 } from './pendingLiqpayCheckout'
import { notifyOrderPlaced } from './customerEmailFlow'

export type FinalizeLiqpayDraftResult =
  | { ok: true; orderId: string; alreadyHadOrder: boolean }
  | { ok: false; message: string }

export function tryFinalizeLiqpayDraft(orderId: string, liqpayPaymentId?: string | null): FinalizeLiqpayDraftResult {
  const dup = readOrders().find((o) => o.liqpayPaymentId && liqpayPaymentId && o.liqpayPaymentId === liqpayPaymentId)
  if (dup) {
    sessionStorage.removeItem(pendingLiqpayStorageKey(orderId))
    return { ok: true, orderId: dup.id, alreadyHadOrder: true }
  }

  if (getOrderById(orderId)) {
    sessionStorage.removeItem(pendingLiqpayStorageKey(orderId))
    return { ok: true, orderId, alreadyHadOrder: true }
  }

  const raw = sessionStorage.getItem(pendingLiqpayStorageKey(orderId))
  if (!raw) {
    return { ok: false, message: 'Чернетку замовлення не знайдено (можливо, очищено дані в браузері).' }
  }

  let draft: PendingLiqpayDraftV1
  try {
    draft = JSON.parse(raw) as PendingLiqpayDraftV1
  } catch {
    return { ok: false, message: 'Пошкоджені дані чернетки замовлення.' }
  }

  if (draft.v !== 1 || draft.orderId !== orderId) {
    return { ok: false, message: 'Некоректна чернетка замовлення.' }
  }

  if (draft.userEmail && draft.bonusSpend > 0) {
    const bal = getBonusBalance(draft.userEmail)
    if (bal < draft.bonusSpend) {
      return { ok: false, message: 'Недостатньо бонусів для завершення замовлення.' }
    }
    const spent = spendBonus(draft.userEmail, draft.bonusSpend)
    if (!spent.ok) return { ok: false, message: spent.message }
  }

  appendOrder({
    id: draft.orderId,
    createdAt: new Date().toISOString(),
    customerName: draft.customerName,
    phone: draft.phone,
    city: draft.city,
    comment: draft.comment,
    lines: draft.lines,
    subtotalUah: draft.subtotalUah,
    bonusRedeemedUah: draft.userEmail && draft.bonusSpend > 0 ? draft.bonusSpend : undefined,
    bonusEarnedUah: draft.userEmail && draft.bonusEarned > 0 ? draft.bonusEarned : undefined,
    totalUah: draft.totalUah,
    paymentMethod: 'liqpay',
    liqpayPaymentId: liqpayPaymentId ?? undefined,
    customerEmail: draft.userEmail,
  })

  const placed = getOrderById(draft.orderId)
  if (placed) void notifyOrderPlaced(placed)

  if (draft.userEmail && draft.bonusEarned > 0) {
    addBonus(draft.userEmail, draft.bonusEarned)
  }

  sessionStorage.removeItem(pendingLiqpayStorageKey(orderId))
  return { ok: true, orderId: draft.orderId, alreadyHadOrder: false }
}

