/**
 * Shop31 — збереження кошика та обраного в localStorage (демо без бекенду).
 * Зв’язки: ShopContext.tsx, CartPage, FavoritesPage, ProductGrid
 */
const FAV_KEY = 'shop31_favorites_v1'
const CART_KEY = 'shop31_cart_v1'

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (!raw) return []
    const p: unknown = JSON.parse(raw)
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function saveFavorites(ids: string[]): void {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids))
}

export function loadCart(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return {}
    const o: unknown = JSON.parse(raw)
    if (!o || typeof o !== 'object' || Array.isArray(o)) return {}
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      const n = typeof v === 'number' ? v : Number(v)
      if (Number.isFinite(n) && n > 0) out[k] = Math.min(999, Math.floor(n))
    }
    return out
  } catch {
    return {}
  }
}

export function saveCart(cart: Record<string, number>): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
}
