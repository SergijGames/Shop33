/**
 * Shop31 — завершення оплаченого замовлення: бонуси, запис у orders після Stripe.
 * Зв’язки: OrderThanksPage, bonusStorage, ordersStorage, pendingStripeCheckout
 */
import { addBonus, getBonusBalance, spendBonus } from '../shop/bonusStorage'
import { notifyOrderPlaced } from './customerEmailFlow'
import { appendOrder, getOrderById, readOrders } from '../shop/ordersStorage'
import { pendingStripeStorageKey, type PendingStripeDraftV1 } from './pendingStripeCheckout'

export type StripePaymentRef = {
  stripeSessionId?: string
  stripePaymentIntentId?: string
}

export type FinalizeStripeDraftResult =
  | { ok: true; orderId: string; alreadyHadOrder: boolean }
  | { ok: false; message: string }

/**
 * Завершує замовлення після підтвердженої оплати Stripe (Checkout або PaymentIntent).
 * Не очищає кошик — робить викликач після успіху, якщо !alreadyHadOrder.
 */
export function tryFinalizeStripeDraft(
  clientRef: string,
  paymentRef: StripePaymentRef,
): FinalizeStripeDraftResult {
  const dup = readOrders().find(
    (o) =>
      (paymentRef.stripeSessionId && o.stripeSessionId === paymentRef.stripeSessionId) ||
      (paymentRef.stripePaymentIntentId && o.stripePaymentIntentId === paymentRef.stripePaymentIntentId),
  )
  if (dup) {
    sessionStorage.removeItem(pendingStripeStorageKey(clientRef))
    return { ok: true, orderId: dup.id, alreadyHadOrder: true }
  }

  if (getOrderById(clientRef)) {
    sessionStorage.removeItem(pendingStripeStorageKey(clientRef))
    return { ok: true, orderId: clientRef, alreadyHadOrder: true }
  }

  const raw = sessionStorage.getItem(pendingStripeStorageKey(clientRef))
  if (!raw) {
    return {
      ok: false,
      message:
        'Чернетку замовлення не знайдено (можливо, інший браузер або очищено дані). Зверніться до підтримки з номером оплати.',
    }
  }

  let draft: PendingStripeDraftV1
  try {
    draft = JSON.parse(raw) as PendingStripeDraftV1
  } catch {
    return { ok: false, message: 'Пошкоджені дані чернетки замовлення.' }
  }

  if (draft.v !== 1 || draft.orderId !== clientRef) {
    return { ok: false, message: 'Некоректна чернетка замовлення.' }
  }

  if (draft.userEmail && draft.bonusSpend > 0) {
    const bal = getBonusBalance(draft.userEmail)
    if (bal < draft.bonusSpend) {
      return {
        ok: false,
        message: 'Недостатньо бонусів для завершення замовлення. Зверніться до підтримки.',
      }
    }
    const spent = spendBonus(draft.userEmail, draft.bonusSpend)
    if (!spent.ok) {
      return { ok: false, message: spent.message }
    }
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
    paymentMethod: 'stripe',
    stripeSessionId: paymentRef.stripeSessionId,
    stripePaymentIntentId: paymentRef.stripePaymentIntentId,
    customerEmail: draft.userEmail,
  })

  const placed = getOrderById(draft.orderId)
  if (placed) void notifyOrderPlaced(placed)

  if (draft.userEmail && draft.bonusEarned > 0) {
    addBonus(draft.userEmail, draft.bonusEarned)
  }

  sessionStorage.removeItem(pendingStripeStorageKey(clientRef))
  return { ok: true, orderId: draft.orderId, alreadyHadOrder: false }
}
