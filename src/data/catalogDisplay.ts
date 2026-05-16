/**
 * Shop31 — підписи та hero-тексти каталогу залежно від мови (UK/EN).
 * Зв’язки: catalogCategories, shopCategories, adminCatalogUiStorage, i18n Locale
 */
import type { CatalogCategoryCard } from './catalogCategories'
import { catalogCategoryCards } from './catalogCategories'
import { loadCatalogUiPrefs } from '../shop/adminCatalogUiStorage'
import type { Locale } from '../i18n/types'
import type { ShopCategoryId } from './shopCategories'
import { shopCategories } from './shopCategories'

const DEFAULT_HERO_LEAD_UK =
  'Оберіть категорію — список товарів відкриється в цьому ж вікні. Фото розділів: Unsplash (вільна ліцензія).'

const DEFAULT_HERO_LEAD_EN =
  'Pick a category — the product list opens in this window. Section photos: Unsplash (free license).'

const CATEGORY_EN: Record<ShopCategoryId, string> = {
  smarfony: 'Smartphones',
  noutbuky: 'Laptops',
  'tb-audio': 'TV & audio',
  pobutova: 'Home appliances',
  gadzhety: 'Gadgets',
  igry: 'Gaming',
  'dlya-domu': 'For home',
  avto: 'Automotive',
}

/** Англійські підзаголовки карток каталогу (як у catalogCategories media). */
const CATEGORY_DESC_EN: Record<ShopCategoryId, string> = {
  smarfony: 'Smartphones and accessories',
  noutbuky: 'For work and study',
  'tb-audio': 'TVs, speakers, media',
  pobutova: 'Kitchen and home appliances',
  gadzhety: 'Tablets, smart devices',
  igry: 'Consoles, peripherals, games',
  'dlya-domu': 'Decor, comfort, organization',
  avto: 'Electronics and car accessories',
}

const CATEGORY_ALT_EN: Record<ShopCategoryId, string> = {
  smarfony: 'Smartphones',
  noutbuky: 'Laptop',
  'tb-audio': 'TV in a living room',
  pobutova: 'Home appliances',
  gadzhety: 'Gadgets',
  igry: 'Game console',
  'dlya-domu': 'Home interior',
  avto: 'Car',
}

export function getCatalogHero(locale: Locale = 'uk'): {
  title: string
  lead: string
  creditCustom: string | null
} {
  const p = loadCatalogUiPrefs()
  const titleDefault = locale === 'en' ? 'Catalog' : 'Каталог'
  const leadDefault = locale === 'en' ? DEFAULT_HERO_LEAD_EN : DEFAULT_HERO_LEAD_UK
  return {
    title: p.heroTitle?.trim() || titleDefault,
    lead: p.heroLead?.trim() || leadDefault,
    creditCustom: p.heroCredit?.trim() ? p.heroCredit.trim() : null,
  }
}

export function getCatalogAllCardText(locale: Locale = 'uk'): { label: string; desc: string } {
  const p = loadCatalogUiPrefs()
  const defaults =
    locale === 'en'
      ? { label: 'All products', desc: 'Show the full assortment' }
      : { label: 'Усі товари', desc: 'Показати весь асортимент' }
  return {
    label: p.allCardLabel?.trim() || defaults.label,
    desc: p.allCardDesc?.trim() || defaults.desc,
  }
}

function applyCategoryOverrides(
  card: CatalogCategoryCard,
  cats: Partial<Record<string, { label?: string; description?: string; image?: string; alt?: string }>>,
): CatalogCategoryCard {
  const o = cats[card.id]
  if (!o) return card
  return {
    ...card,
    label: o.label?.trim() || card.label,
    description: o.description?.trim() || card.description,
    image: o.image?.trim() || card.image,
    alt: o.alt?.trim() || card.alt,
  }
}

export function getCatalogCategoryCards(locale: Locale = 'uk'): CatalogCategoryCard[] {
  const p = loadCatalogUiPrefs()
  const cats = p.categories ?? {}
  const hidden = new Set(p.hiddenCategoryIds ?? [])

  const builtIn = catalogCategoryCards
    .filter((card) => !hidden.has(card.id))
    .map((card) => applyCategoryOverrides(card, cats))

  const custom: CatalogCategoryCard[] = (p.customCategories ?? []).map((c) => {
    const o = cats[c.id]
    return {
      id: c.id as ShopCategoryId,
      label: o?.label?.trim() || c.label,
      description: o?.description?.trim() || c.description,
      image: o?.image?.trim() || c.image,
      alt: o?.alt?.trim() || c.alt,
      glow: c.glow,
    }
  })

  const mapped = [...builtIn, ...custom]

  if (locale === 'uk') return mapped

  return mapped.map((card) => {
    const o = cats[card.id]
    const customLabel = o?.label?.trim()
    const customDesc = o?.description?.trim()
    const customAlt = o?.alt?.trim()
    return {
      ...card,
      label: customLabel || getCategoryDisplayLabel(card.id, 'en'),
      description: customDesc || CATEGORY_DESC_EN[card.id] || card.description,
      alt: customAlt || CATEGORY_ALT_EN[card.id] || card.alt,
    }
  })
}

export function getCategoryDisplayLabel(categoryId: string, locale: Locale = 'uk'): string {
  const prefs = loadCatalogUiPrefs()
  const o = prefs.categories?.[categoryId]
  if (o?.label?.trim()) return o.label.trim()
  const custom = prefs.customCategories?.find((c) => c.id === categoryId)
  if (custom) return custom.label
  if (locale === 'en' && categoryId in CATEGORY_EN) {
    return CATEGORY_EN[categoryId as ShopCategoryId]
  }
  return shopCategories.find((c) => c.id === categoryId)?.label ?? categoryId
}

export function isKnownCatalogCategoryId(id: string): boolean {
  if (!id) return false
  const prefs = loadCatalogUiPrefs()
  if (prefs.hiddenCategoryIds?.includes(id)) return false
  if (prefs.customCategories?.some((c) => c.id === id)) return true
  return shopCategories.some((c) => c.id === id)
}
