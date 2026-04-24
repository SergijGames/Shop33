/**
 * Shop31 — «кодові» правки полів існуючих товарів з адмін-панелі (localStorage).
 * Зв’язки: AdminProductsPage, data/catalog.ts
 */
import type { Product, ProductReview, ProductVideo } from '../data/products'
import { products } from '../data/products'
import type { ShopCategoryId } from '../data/shopCategories'
import { shopCategories } from '../data/shopCategories'

const KEY = 'shop31_admin_code_product_edits_v1'

const ALLOWED_IDS = new Set(products.map((p) => p.id))
const CATEGORY_SET = new Set<string>(shopCategories.map((c) => c.id))

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

function parseReviews(raw: unknown): ProductReview[] {
  if (!Array.isArray(raw)) return []
  const out: ProductReview[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const author = typeof item.author === 'string' ? item.author : ''
    const text = typeof item.text === 'string' ? item.text : ''
    const date = typeof item.date === 'string' ? item.date : ''
    const rating = Number(item.rating)
    if (!author || !text || !date || !Number.isFinite(rating)) continue
    out.push({
      author: author.slice(0, 200),
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      date: date.slice(0, 32),
      text: text.slice(0, 4000),
    })
  }
  return out
}

function parseVideos(raw: unknown): ProductVideo[] {
  if (!Array.isArray(raw)) return []
  const out: ProductVideo[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const title = typeof item.title === 'string' ? item.title : ''
    const youtubeId = typeof item.youtubeId === 'string' ? item.youtubeId : ''
    if (!title || !youtubeId) continue
    out.push({ title: title.slice(0, 200), youtubeId: youtubeId.slice(0, 32) })
  }
  return out
}

function parseSpecsTable(raw: unknown): { label: string; value: string }[] {
  if (!Array.isArray(raw)) return []
  const out: { label: string; value: string }[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const label = typeof item.label === 'string' ? item.label : ''
    const value = typeof item.value === 'string' ? item.value : ''
    if (!label) continue
    out.push({ label: label.slice(0, 120), value: value.slice(0, 500) })
  }
  return out
}

function parseGallery(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((s) => s.trim().slice(0, 2000))
}

function parseEditedEntry(raw: unknown, expectedId: string): Product | null {
  if (!isRecord(raw)) return null
  const id = typeof raw.id === 'string' ? raw.id : ''
  if (id !== expectedId || !ALLOWED_IDS.has(id)) return null
  const name = typeof raw.name === 'string' ? raw.name : ''
  if (name.trim().length < 2) return null
  const categoryId = typeof raw.categoryId === 'string' ? raw.categoryId : ''
  if (!CATEGORY_SET.has(categoryId)) return null
  const priceUah = Number(raw.priceUah)
  if (!Number.isFinite(priceUah) || priceUah < 0) return null
  let oldPriceUah: number | null = null
  if (raw.oldPriceUah === null) oldPriceUah = null
  else if (typeof raw.oldPriceUah === 'number' && Number.isFinite(raw.oldPriceUah)) {
    oldPriceUah = Math.round(raw.oldPriceUah)
  }
  const tag =
    typeof raw.tag === 'string' && raw.tag.trim() ? raw.tag.trim().slice(0, 40) : 'Новинка'
  const image = typeof raw.image === 'string' && raw.image.trim() ? raw.image.trim() : ''
  if (!image) return null
  const description =
    typeof raw.description === 'string' && raw.description.trim()
      ? raw.description.trim().slice(0, 8000)
      : 'Опис товару.'
  const spec =
    typeof raw.spec === 'string' && raw.spec.trim() ? raw.spec.trim().slice(0, 300) : undefined
  let gallery = parseGallery(raw.gallery)
  if (gallery.length === 0) gallery = [image]
  return {
    id,
    name: name.trim().slice(0, 500),
    spec,
    priceUah: Math.round(priceUah),
    oldPriceUah,
    tag,
    image,
    categoryId: categoryId as ShopCategoryId,
    description,
    gallery,
    videos: parseVideos(raw.videos),
    specsTable: parseSpecsTable(raw.specsTable),
    reviews: parseReviews(raw.reviews),
  }
}

export function loadCodeProductEdits(): Record<string, Product> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const obj: unknown = JSON.parse(raw)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {}
    const out: Record<string, Product> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (!ALLOWED_IDS.has(k)) continue
      const p = parseEditedEntry(v, k)
      if (p) out[k] = p
    }
    return out
  } catch {
    return {}
  }
}

function saveMap(map: Record<string, Product>): void {
  localStorage.setItem(KEY, JSON.stringify(map))
}

export function upsertCodeProductEdit(product: Product): void {
  if (!ALLOWED_IDS.has(product.id)) return
  const map = loadCodeProductEdits()
  map[product.id] = product
  saveMap(map)
}

export function removeCodeProductEdit(id: string): void {
  if (!ALLOWED_IDS.has(id)) return
  const map = loadCodeProductEdits()
  delete map[id]
  saveMap(map)
}
