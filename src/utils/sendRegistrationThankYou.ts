/**
 * Shop31 — листи через EmailJS: реєстрація та підтвердження замовлення.
 * Резерв mailto — у customerEmailFlow (викликається з AuthContext / checkout).
 * Зв’язки: RegisterPage, customerEmailFlow, ordersStorage (тип замовлення)
 */
import emailjs from '@emailjs/browser'
import type { SavedOrder } from '../shop/ordersStorage'

export type RegistrationThankYouResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' }
  | { ok: false; reason: 'send_failed'; message: string }

function emailJsErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'text' in err && typeof (err as { text?: string }).text === 'string') {
    return (err as { text: string }).text
  }
  if (err instanceof Error) return err.message
  return String(err)
}

type EmailJsCreds = { publicKey: string; serviceId: string }

function readEmailJsBase(): EmailJsCreds | null {
  const publicKey = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined)?.trim()
  const serviceId = (import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined)?.trim()
  if (!publicKey || !serviceId) return null
  return { publicKey, serviceId }
}

function registrationTemplateId(): string | undefined {
  return (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined)?.trim()
}

/** Окремий шаблон для замовлень; якщо пусто — той самий, що й для реєстрації. */
function orderTemplateId(): string | undefined {
  const orderTpl = (import.meta.env.VITE_EMAILJS_TEMPLATE_ORDER_ID as string | undefined)?.trim()
  const def = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined)?.trim()
  return orderTpl || def
}

async function sendEmailJs(
  templateId: string,
  templateParams: Record<string, string>,
): Promise<RegistrationThankYouResult> {
  const base = readEmailJsBase()
  if (!base || !templateId) {
    const missing: string[] = []
    if (!base) {
      if (!(import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined)?.trim()) {
        missing.push('VITE_EMAILJS_PUBLIC_KEY')
      }
      if (!(import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined)?.trim()) {
        missing.push('VITE_EMAILJS_SERVICE_ID')
      }
    }
    if (!templateId) missing.push('VITE_EMAILJS_TEMPLATE_ID')
    console.warn(
      `[Shop31] EmailJS: не надіслано — у .env немає: ${missing.join(', ')}. Див. .env.example.`,
    )
    return { ok: false, reason: 'not_configured' }
  }

  try {
    emailjs.init({ publicKey: base.publicKey })
    await emailjs.send(base.serviceId, templateId, templateParams)
    return { ok: true }
  } catch (err) {
    console.error('[Shop31] EmailJS:', err)
    return { ok: false, reason: 'send_failed', message: emailJsErrorMessage(err) }
  }
}

/**
 * Лист-подяка після реєстрації (EmailJS з браузера).
 *
 * У шаблоні EmailJS одержувач — {{user_email}}.
 * Поля: user_email, email, user_name, email_intro, thank_you_text, email_subject
 */
export async function sendRegistrationThankYou(params: {
  email: string
  name: string
}): Promise<RegistrationThankYouResult> {
  const templateId = registrationTemplateId()
  if (!templateId) {
    console.warn('[Shop31] Лист реєстрації: задайте VITE_EMAILJS_TEMPLATE_ID у .env')
    return { ok: false, reason: 'not_configured' }
  }

  const emailIntro = `Вітаємо, ${params.name}! Дякуємо за реєстрацію в Shop31.`

  const thankYouText = `${emailIntro}

Раді бачити вас у нашому неоновому магазині.

Гарних покупок!
Команда Shop31`

  return sendEmailJs(templateId, {
    user_email: params.email,
    email: params.email,
    user_name: params.name,
    email_intro: emailIntro,
    email_subject: 'Дякуємо за реєстрацію в Shop31',
    thank_you_text: thankYouText,
  })
}

/**
 * Підтвердження замовлення на email (той самий або окремий шаблон VITE_EMAILJS_TEMPLATE_ORDER_ID).
 * Для гостя лист іде на hello@shop31.ua (поле user_email), у тексті — дані покупця.
 *
 * Рекомендовані поля шаблону (як у реєстрації + опційно):
 *   order_id, order_summary, payment_label
 */
export async function sendOrderConfirmationEmail(order: SavedOrder): Promise<RegistrationThankYouResult> {
  const templateId = orderTemplateId()
  if (!templateId) {
    return { ok: false, reason: 'not_configured' }
  }

  const summary = order.lines
    .map((l) => `${l.name} × ${l.qty} — ${l.priceUah * l.qty} грн`)
    .join('\n')

  const paymentLabel =
    order.paymentMethod === 'stripe'
      ? 'Оплата карткою (Stripe)'
      : order.paymentMethod === 'liqpay'
        ? 'Оплата через LiqPay'
        : 'Оформлення без онлайн-оплати карткою'

  const toEmail = order.customerEmail?.trim() || 'hello@shop31.ua'

  const intro = order.customerEmail?.trim()
    ? `Дякуємо за замовлення, ${order.customerName}!`
    : `Нове замовлення від гостя: ${order.customerName}, тел. ${order.phone}.`

  const thankYouText = `${intro}

Номер замовлення: ${order.id}
До сплати: ${order.totalUah} грн
Спосіб: ${paymentLabel}

Товари:
${summary}

Місто / доставка: ${order.city}
${order.comment ? `Коментар: ${order.comment}\n` : ''}
Ми зв’яжемося для підтвердження.
Команда Shop31`

  return sendEmailJs(templateId, {
    user_email: toEmail,
    email: toEmail,
    user_name: order.customerName,
    email_intro: intro,
    email_subject: `Замовлення Shop31 №${order.id}`,
    thank_you_text: thankYouText,
    order_id: order.id,
    order_summary: summary,
    payment_label: paymentLabel,
  })
}
