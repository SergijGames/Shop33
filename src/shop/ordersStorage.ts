/**
 * Shop31 — історія замовлень у localStorage (демо).
 * Зв’язки: CheckoutPage, OrderThanksPage, UserOrdersPage, useBonusBalance
 */
const ORDERS_KEY = 'shop31_orders_v1'

export type OrderLine = {
  productId: string
  name: string
  priceUah: number
  qty: number
}

export type SavedOrder = {
  id: string
  createdAt: string
  customerName: string
  phone: string
  city: string
  comment: string
  lines: OrderLine[]
  /** Сума до списання бонусів (якщо не задано — дорівнює сумі рядків). */
  subtotalUah?: number
  /** Скільки бонусних балів (грн) знято з рахунку при оплаті. */
  bonusRedeemedUah?: number
  /** Скільки бонусів нараховано за це замовлення. */
  bonusEarnedUah?: number
  /** Пошта залогіненого покупця (якщо оформлював під акаунтом). */
  customerEmail?: string
  /** Сума до сплати після бонусів. */
  totalUah: number
  /** Як оформлено оплату (демо без карти / Stripe). */
  paymentMethod?: 'demo' | 'stripe' | 'liqpay'
  /** Ідентифікатор сесії Stripe Checkout (якщо є). */
  stripeSessionId?: string
  /** Ідентифікатор PaymentIntent при оплаті на сайті (Stripe Elements). */
  stripePaymentIntentId?: string
  /** Ідентифікатор платежу LiqPay (якщо є). */
  liqpayPaymentId?: string
}

export function readOrders(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) return []
    const p: unknown = JSON.parse(raw)
    return Array.isArray(p) ? (p as SavedOrder[]) : []
  } catch {
    return []
  }
}

export function appendOrder(order: SavedOrder): void {
  const all = readOrders()
  all.unshift(order)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all))
}

export function getOrderById(id: string): SavedOrder | undefined {
  return readOrders().find((o) => o.id === id)
}

export function createOrderId(): string {
  const r = Math.random().toString(36).slice(2, 8)
  return `S31-${Date.now().toString(36).toUpperCase()}-${r}`
}

export function saveOrders(orders: SavedOrder[]): void {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

export function deleteOrder(id: string): void {
  saveOrders(readOrders().filter((o) => o.id !== id))
}

export function clearAllOrders(): void {
  localStorage.removeItem(ORDERS_KEY)
}
