/**
 * Shop31 — ідентифікатори категорій вітрини та мітки для фільтра каталогу (?cat=...).
 * Зв’язки: catalogDisplay.ts, Catalog*Page, catalog.ts
 */
import { loadCatalogUiPrefs } from '../shop/adminCatalogUiStorage'

export type ShopCategoryId =
  | 'smarfony'
  | 'noutbuky'
  | 'tb-audio'
  | 'pobutova'
  | 'gadzhety'
  | 'igry'
  | 'dlya-domu'
  | 'avto'

export type ShopCategory = {
  id: ShopCategoryId
  label: string
}

export const shopCategories: ShopCategory[] = [
  { id: 'smarfony', label: 'Смартфони' },
  { id: 'noutbuky', label: 'Ноутбуки' },
  { id: 'tb-audio', label: 'ТБ та аудіо' },
  { id: 'pobutova', label: 'Побутова техніка' },
  { id: 'gadzhety', label: 'Гаджети' },
  { id: 'igry', label: 'Ігри' },
  { id: 'dlya-domu', label: 'Для дому' },
  { id: 'avto', label: 'Авто' },
]

const ids = new Set(shopCategories.map((c) => c.id))

export function parseCategoryParam(value: string | null): ShopCategoryId | '' {
  if (!value) return ''
  if (ids.has(value as ShopCategoryId)) return value as ShopCategoryId
  return ''
}

/** Базові + кастомні категорії з адмінки (для маршруту /catalog/:id). */
export function parseCategoryRouteId(value: string | null): string {
  if (!value) return ''
  if (parseCategoryParam(value)) return value
  const p = loadCatalogUiPrefs()
  if (p.hiddenCategoryIds?.includes(value)) return ''
  if (p.customCategories?.some((c) => c.id === value)) return value
  return ''
}
