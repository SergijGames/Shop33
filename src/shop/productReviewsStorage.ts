/**
 * Shop31 — додаткові відгуки до товарів (localStorage), зливаються у catalog.
 * Зв’язки: ProductPage, data/catalog.ts, data/products.ts
 */
import type { ProductReview } from '../data/products'

const KEY = 'shop31_product_reviews_v1'

export type ExtraReviewsMap = Record<string, ProductReview[]>

function sanitizeList(raw: unknown): ProductReview[] {
  if (!Array.isArray(raw)) return []
  const out: ProductReview[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const author = typeof r.author === 'string' ? r.author : ''
    const text = typeof r.text === 'string' ? r.text : ''
    const date = typeof r.date === 'string' ? r.date : ''
    const rating = typeof r.rating === 'number' ? r.rating : Number(r.rating)
    if (!author || !text || !date || !Number.isFinite(rating)) continue
    out.push({
      author: author.slice(0, 120),
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      date: date.slice(0, 32),
      text: text.slice(0, 4000),
    })
  }
  return out
}

export function readExtraReviewsMap(): ExtraReviewsMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const p: unknown = JSON.parse(raw)
    if (!p || typeof p !== 'object' || Array.isArray(p)) return {}
    const map: ExtraReviewsMap = {}
    for (const [id, list] of Object.entries(p as Record<string, unknown>)) {
      if (typeof id !== 'string' || !id) continue
      map[id] = sanitizeList(list)
    }
    return map
  } catch {
    return {}
  }
}

export function extraReviewsForProduct(productId: string): ProductReview[] {
  return readExtraReviewsMap()[productId] ?? []
}

export function appendProductReview(
  productId: string,
  draft: { author: string; rating: number; text: string },
): { ok: true } | { ok: false; message: string } {
  const author = draft.author.trim()
  const text = draft.text.trim()
  if (author.length < 2) {
    return { ok: false, message: 'Вкажіть ім’я або нік (мінімум 2 символи).' }
  }
  if (text.length < 10) {
    return { ok: false, message: 'Текст відгуку — щонайменше 10 символів.' }
  }
  const rating = Math.min(5, Math.max(1, Math.round(Number(draft.rating))))
  if (!Number.isFinite(rating)) {
    return { ok: false, message: 'Оберіть оцінку від 1 до 5.' }
  }
  const review: ProductReview = {
    author: author.slice(0, 120),
    rating,
    date: new Date().toISOString().slice(0, 10),
    text: text.slice(0, 4000),
  }
  const all = readExtraReviewsMap()
  const list = all[productId] ?? []
  all[productId] = [...list, review]
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    return { ok: false, message: 'Не вдалося зберегти відгук (сховище переповнене?).' }
  }
  return { ok: true }
}
