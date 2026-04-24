/**
 * Shop31 — збережені в адмінці налаштування UI каталогу (hero, порядок тощо).
 * Зв’язки: AdminCatalogPage, catalogDisplay.ts
 */
import type { ShopCategoryId } from '../data/shopCategories'
import { shopCategories } from '../data/shopCategories'

const KEY = 'shop31_admin_catalog_ui_v1'

const CAT_SET = new Set<string>(shopCategories.map((c) => c.id))

export type CategoryUiOverride = {
  label?: string
  description?: string
  image?: string
  alt?: string
}

export type CatalogUiPrefs = {
  heroTitle?: string
  heroLead?: string
  /** Замість стандартного рядка про Unsplash; plain text */
  heroCredit?: string
  allCardLabel?: string
  allCardDesc?: string
  categories?: Partial<Record<ShopCategoryId, CategoryUiOverride>>
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

function parseOverride(raw: unknown): CategoryUiOverride | undefined {
  if (!isRecord(raw)) return undefined
  const o: CategoryUiOverride = {}
  if (typeof raw.label === 'string') o.label = raw.label.slice(0, 120)
  if (typeof raw.description === 'string') o.description = raw.description.slice(0, 300)
  if (typeof raw.image === 'string') o.image = raw.image.trim().slice(0, 2000)
  if (typeof raw.alt === 'string') o.alt = raw.alt.slice(0, 200)
  return Object.keys(o).length ? o : undefined
}

export function loadCatalogUiPrefs(): CatalogUiPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const p: unknown = JSON.parse(raw)
    if (!isRecord(p)) return {}
    const out: CatalogUiPrefs = {}
    if (typeof p.heroTitle === 'string') out.heroTitle = p.heroTitle.slice(0, 200)
    if (typeof p.heroLead === 'string') out.heroLead = p.heroLead.slice(0, 2000)
    if (typeof p.heroCredit === 'string') out.heroCredit = p.heroCredit.slice(0, 500)
    if (typeof p.allCardLabel === 'string') out.allCardLabel = p.allCardLabel.slice(0, 120)
    if (typeof p.allCardDesc === 'string') out.allCardDesc = p.allCardDesc.slice(0, 300)
    if (p.categories && isRecord(p.categories)) {
      const cats: Partial<Record<ShopCategoryId, CategoryUiOverride>> = {}
      for (const [id, v] of Object.entries(p.categories)) {
        if (!CAT_SET.has(id)) continue
        const parsed = parseOverride(v)
        if (parsed) cats[id as ShopCategoryId] = parsed
      }
      if (Object.keys(cats).length) out.categories = cats
    }
    return out
  } catch {
    return {}
  }
}

export function saveCatalogUiPrefs(prefs: CatalogUiPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}
