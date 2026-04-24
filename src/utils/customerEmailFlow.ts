/**
 * Shop31 — автоматичні листи після замовлення (EmailJS + резерв mailto) і mailto після реєстрації.
 * Зв’язки: sendRegistrationThankYou, AuthContext, CheckoutPage, finalizeStripeDraft
 */
import type { SavedOrder } from '../shop/ordersStorage'
import {
  sendOrderConfirmationEmail,
  type RegistrationThankYouResult,
} from './sendRegistrationThankYou'

/** Куди надсилати копію замовлення гостя (немає email акаунта). */
export const SHOP_ORDER_INBOX = 'hello@shop31.ua'

const ORDER_MAIL_DEDUP = 'shop31_order_mailed_'

export function formatOrderSummaryUk(order: SavedOrder): string {
  const lines = order.lines
    .map((l) => `${l.name} × ${l.qty} — ${l.priceUah * l.qty} грн`)
    .join('\n')
  const pay = order.paymentMethod === 'stripe' ? 'Картка (Stripe)' : 'Демо-оформлення'
  return [
    `Замовлення: ${order.id}`,
    `Дата: ${order.createdAt}`,
    `ПІБ: ${order.customerName}`,
    `Телефон: ${order.phone}`,
    `Місто / НП: ${order.city}`,
    order.comment ? `Коментар: ${order.comment}` : '',
    `Спосіб оплати: ${pay}`,
    `До сплати: ${order.totalUah} грн`,
    '',
    'Товари:',
    lines,
  ]
    .filter(Boolean)
    .join('\n')
}

/** Відкриває поштовий клієнт з чернеткою (потрібен жест користувача — викликайте після submit). */
export function triggerMailto(href: string): void {
  try {
    const a = document.createElement('a')
    a.setAttribute('href', href)
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
    a.style.cssText = 'position:fixed;left:-9999px;top:0'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch {
    window.location.href = href
  }
}

/** Якщо EmailJS не надіслав лист реєстрації — відкривається mailto на пошту користувача з чернеткою. */
export function openRegistrationMailtoFallback(
  name: string,
  email: string,
  result: RegistrationThankYouResult,
): void {
  if (result.ok) return
  const subject = encodeURIComponent('Shop31 — підтвердження реєстрації')
  const body = encodeURIComponent(
    `Вітаємо, ${name}!\n\nВи зареєструвалися в Shop31. Логін (email): ${email}\n\n` +
      '(Це чернетка у вашій поштовій програмі, бо EmailJS не налаштовано або сталася помилка відправлення.)\n\n' +
      'Команда Shop31',
  )
  triggerMailto(`mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`)
}

/**
 * Один раз на замовлення: EmailJS лист покупцю (або на магазин для гостя), інакше — mailto.
 */
export async function notifyOrderPlaced(order: SavedOrder): Promise<void> {
  try {
    const key = `${ORDER_MAIL_DEDUP}${order.id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    const res = await sendOrderConfirmationEmail(order)
    if (res.ok) return

    const summary = formatOrderSummaryUk(order)
    const guest = !order.customerEmail?.trim()

    if (guest) {
      const subject = encodeURIComponent(`Нове замовлення Shop31 ${order.id}`)
      const body = encodeURIComponent(`${summary}\n\n(Гість оформив замовлення; EmailJS не налаштовано.)`)
      triggerMailto(`mailto:${SHOP_ORDER_INBOX}?subject=${subject}&body=${body}`)
      return
    }

    const email = order.customerEmail!.trim()
    const subject = encodeURIComponent(`Shop31 — ваше замовлення ${order.id}`)
    const body = encodeURIComponent(
      `${summary}\n\n(Чернетка у поштовій програмі; EmailJS не надіслав лист автоматично.)`,
    )
    triggerMailto(`mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`)
  } catch (e) {
    console.warn('[Shop31] notifyOrderPlaced', e)
  }
}
