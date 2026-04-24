/**
 * Shop31 — зведений каталог: базові products + кастомні товари + правки адмінки + відгуки.
 * Єдина точка getShopProductById / списків для вітрини.
 * Зв’язки: products.ts, shop/admin*Storage, productReviewsStorage
 */
import { loadCodeProductEdits } from '../shop/adminCodeProductEditsStorage'
import { loadCustomProducts } from '../shop/adminCustomProductsStorage'
import { extraReviewsForProduct } from '../shop/productReviewsStorage'
import type { Product } from './products'
import { products } from './products'

const CATALOG_PREFS_KEY = 'shop31_admin_catalog_v1'

export type CatalogOverrides = Partial<
  Pick<Product, 'name' | 'priceUah' | 'oldPriceUah'>
>

export type CatalogPrefs = {
  hiddenIds: string[]
  overrides: Record<string, CatalogOverrides>
}

const defaultPrefs: CatalogPrefs = { hiddenIds: [], overrides: {} }

export function loadCatalogPrefs(): CatalogPrefs {
  try {
    const raw = localStorage.getItem(CATALOG_PREFS_KEY)
    if (!raw) return { ...defaultPrefs, hiddenIds: [], overrides: {} }
    const p = JSON.parse(raw) as Partial<CatalogPrefs>
    const hiddenIds = Array.isArray(p.hiddenIds)
      ? p.hiddenIds.filter((x): x is string => typeof x === 'string')
      : []
    const overrides =
      p.overrides && typeof p.overrides === 'object' && !Array.isArray(p.overrides)
        ? (p.overrides as Record<string, CatalogOverrides>)
        : {}
    return { hiddenIds, overrides }
  } catch {
    return { ...defaultPrefs, hiddenIds: [], overrides: {} }
  }
}

export function saveCatalogPrefs(prefs: CatalogPrefs): void {
  localStorage.setItem(CATALOG_PREFS_KEY, JSON.stringify(prefs))
}

/** При видаленні товару — прибрати прихованість і оверрайди для цього id. */
export function purgeProductCatalogPrefs(productId: string): void {
  const prefs = loadCatalogPrefs()
  const overrides = { ...prefs.overrides }
  delete overrides[productId]
  saveCatalogPrefs({
    hiddenIds: prefs.hiddenIds.filter((id) => id !== productId),
    overrides,
  })
}

function applyOverride(base: Product, o: CatalogOverrides): Product {
  return {
    ...base,
    ...o,
    oldPriceUah:
      o.oldPriceUah !== undefined ? o.oldPriceUah : base.oldPriceUah,
  }
}

/** Для адмін-форми: базовий товар + швидкі оверрайди назви/цін з prefs. */
export function applyCatalogItemPrefs(base: Product, productId: string): Product {
  const o = loadCatalogPrefs().overrides[productId]
  if (!o || Object.keys(o).length === 0) return base
  return applyOverride(base, o)
}

function resolveShopProductBase(id: string): Product | undefined {
  const custom = loadCustomProducts().find((p) => p.id === id)
  if (custom) return custom
  const edits = loadCodeProductEdits()
  if (edits[id]) return edits[id]
  return products.find((p) => p.id === id)
}

function withExtraReviews(p: Product): Product {
  const extra = extraReviewsForProduct(p.id)
  if (extra.length === 0) return p
  return { ...p, reviews: [...p.reviews, ...extra] }
}

/** Товари для вітрини (каталог, пошук, головна) — з урахуванням налаштувань адміна. */
export function getShopProducts(): Product[] {
  const { hiddenIds, overrides } = loadCatalogPrefs()
  const hidden = new Set(hiddenIds)
  const custom = loadCustomProducts()
  const combined = [...custom, ...products]
  return combined
    .filter((p) => !hidden.has(p.id))
    .map((p) => {
      const resolved = resolveShopProductBase(p.id) ?? p
      const o = overrides[p.id]
      const merged =
        o && Object.keys(o).length > 0 ? applyOverride(resolved, o) : resolved
      return withExtraReviews(merged)
    })
}

/** Картка товару на вітрині; якщо приховано — undefined. */
export function getShopProductById(id: string): Product | undefined {
  const { hiddenIds, overrides } = loadCatalogPrefs()
  if (hiddenIds.includes(id)) return undefined
  const base = resolveShopProductBase(id)
  if (!base) return undefined
  const o = overrides[id]
  const merged =
    o && Object.keys(o).length > 0 ? applyOverride(base, o) : base
  return withExtraReviews(merged)
}
