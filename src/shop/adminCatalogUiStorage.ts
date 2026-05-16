/**
 * Shop31 — збережені в адмінці налаштування UI каталогу (hero, порядок тощо).
 * Зв’язки: AdminCatalogPage, catalogDisplay.ts
 */
import type { CatalogGlow } from '../data/catalogCategories'

const KEY = 'shop31_admin_catalog_ui_v1'

export type CategoryUiOverride = {
  label?: string
  description?: string
  image?: string
  alt?: string
}

export type CustomCategoryDef = {
  id: string
  label: string
  description: string
  image: string
  alt: string
  glow: CatalogGlow
}

export type CatalogUiPrefs = {
  heroTitle?: string
  heroLead?: string
  /** Замість стандартного рядка про Unsplash; plain text */
  heroCredit?: string
  allCardLabel?: string
  allCardDesc?: string
  /** id категорій, прихованих на вітрині (базові з коду) */
  hiddenCategoryIds?: string[]
  /** Додаткові категорії, створені в адмінці */
  customCategories?: CustomCategoryDef[]
  categories?: Partial<Record<string, CategoryUiOverride>>
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
    if (Array.isArray(p.hiddenCategoryIds)) {
      out.hiddenCategoryIds = p.hiddenCategoryIds
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => x.trim())
    }
    if (Array.isArray(p.customCategories)) {
      const glows = new Set(['cyan', 'magenta', 'lime', 'violet'])
      out.customCategories = p.customCategories
        .map((raw) => {
          if (!isRecord(raw)) return null
          const id = typeof raw.id === 'string' ? raw.id.trim() : ''
          const label = typeof raw.label === 'string' ? raw.label.trim() : ''
          if (!id || !label) return null
          const g = typeof raw.glow === 'string' ? raw.glow : 'cyan'
          return {
            id: id.slice(0, 80),
            label: label.slice(0, 120),
            description:
              typeof raw.description === 'string' ? raw.description.trim().slice(0, 300) : '',
            image:
              typeof raw.image === 'string' && raw.image.trim()
                ? raw.image.trim().slice(0, 2000)
                : '',
            alt: typeof raw.alt === 'string' ? raw.alt.trim().slice(0, 200) : label,
            glow: glows.has(g) ? (g as CustomCategoryDef['glow']) : 'cyan',
          }
        })
        .filter((x): x is CustomCategoryDef => x !== null)
    }
    if (p.categories && isRecord(p.categories)) {
      const cats: Partial<Record<string, CategoryUiOverride>> = {}
      for (const [id, v] of Object.entries(p.categories)) {
        if (!id.trim()) continue
        const parsed = parseOverride(v)
        if (parsed) cats[id] = parsed
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

export function slugifyCategoryId(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return base || `cat-${Date.now().toString(36)}`
}

export function hideBuiltInCategory(id: string): void {
  const p = loadCatalogUiPrefs()
  const hidden = new Set(p.hiddenCategoryIds ?? [])
  hidden.add(id)
  saveCatalogUiPrefs({ ...p, hiddenCategoryIds: [...hidden] })
}

export function restoreBuiltInCategory(id: string): void {
  const p = loadCatalogUiPrefs()
  saveCatalogUiPrefs({
    ...p,
    hiddenCategoryIds: (p.hiddenCategoryIds ?? []).filter((x) => x !== id),
  })
}

export function upsertCustomCategory(cat: CustomCategoryDef): void {
  const p = loadCatalogUiPrefs()
  const list = [...(p.customCategories ?? [])]
  const i = list.findIndex((x) => x.id === cat.id)
  if (i >= 0) list[i] = cat
  else list.unshift(cat)
  saveCatalogUiPrefs({ ...p, customCategories: list })
}

export function deleteCustomCategory(id: string): void {
  const p = loadCatalogUiPrefs()
  const cats = { ...p.categories }
  delete cats[id]
  saveCatalogUiPrefs({
    ...p,
    customCategories: (p.customCategories ?? []).filter((x) => x.id !== id),
    categories: cats,
  })
}
