/**
 * Shop31 — персональні підбірки товарів для користувачів (адмінка → localStorage).
 * Зв’язки: AdminUserCatalogsSection, CatalogCategoryPage (колекції)
 */
import type { CatalogGlow } from '../data/catalogCategories'
import type { Product } from '../data/products'

const KEY = 'shop31_user_catalogs_v1'

const GLOWS: CatalogGlow[] = ['cyan', 'magenta', 'lime', 'violet']

export type UserCatalog = {
  id: string
  title: string
  description: string
  image: string
  alt: string
  glow: CatalogGlow
  productIds: string[]
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

export function createUserCatalogId(): string {
  const r = Math.random().toString(36).slice(2, 7)
  return `u-${Date.now().toString(36)}-${r}`
}

function parseOne(raw: unknown): UserCatalog | null {
  if (!isRecord(raw)) return null
  const id = typeof raw.id === 'string' ? raw.id : ''
  if (!id.startsWith('u-')) return null
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (title.length < 1) return null
  const description =
    typeof raw.description === 'string' ? raw.description.trim().slice(0, 500) : ''
  const image =
    typeof raw.image === 'string' && raw.image.trim() ? raw.image.trim().slice(0, 2000) : ''
  if (!image) return null
  const alt = typeof raw.alt === 'string' ? raw.alt.trim().slice(0, 200) : title.slice(0, 120)
  const g = typeof raw.glow === 'string' ? raw.glow : ''
  const glow = GLOWS.includes(g as CatalogGlow) ? (g as CatalogGlow) : 'cyan'
  let productIds: string[] = []
  if (Array.isArray(raw.productIds)) {
    productIds = raw.productIds
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map((x) => x.trim())
  }
  return { id, title: title.slice(0, 200), description, image, alt, glow, productIds }
}

export function loadUserCatalogs(): UserCatalog[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const p: unknown = JSON.parse(raw)
    if (!Array.isArray(p)) return []
    return p.map(parseOne).filter((x): x is UserCatalog => x !== null)
  } catch {
    return []
  }
}

export function saveUserCatalogs(list: UserCatalog[]): void {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function findUserCatalog(id: string): UserCatalog | undefined {
  return loadUserCatalogs().find((c) => c.id === id)
}

export function upsertUserCatalog(catalog: UserCatalog): void {
  const list = loadUserCatalogs()
  const i = list.findIndex((x) => x.id === catalog.id)
  if (i >= 0) list[i] = catalog
  else list.unshift(catalog)
  saveUserCatalogs(list)
}

export function deleteUserCatalog(id: string): void {
  saveUserCatalogs(loadUserCatalogs().filter((x) => x.id !== id))
}

/** Товари з вітрини в порядку id з підбірки (лише наявні). */
export function productsForUserCatalog(
  catalog: UserCatalog,
  shopProducts: Product[],
): Product[] {
  const map = new Map(shopProducts.map((p) => [p.id, p]))
  return catalog.productIds.map((id) => map.get(id)).filter((p): p is Product => p !== undefined)
}

export function visibleCountInUserCatalog(
  catalog: UserCatalog,
  shopProducts: Product[],
): number {
  const set = new Set(shopProducts.map((p) => p.id))
  return catalog.productIds.filter((id) => set.has(id)).length
}
