/**
 * Shop31 — медіа-картки категорій для головної/каталогу (зображення, опис, glow).
 * Зв’язки: catalogDisplay.ts, HomePage, CatalogIndexPage
 */
import type { ShopCategoryId } from './shopCategories'
import { shopCategories } from './shopCategories'

export type CatalogGlow = 'cyan' | 'magenta' | 'lime' | 'violet'

type Media = {
  description: string
  glow: CatalogGlow
  image: string
  alt: string
}

/** Фото Unsplash — https://unsplash.com/license */
const mediaById: Record<ShopCategoryId, Media> = {
  smarfony: {
    description: 'Смартфони та аксесуари',
    glow: 'cyan',
    image:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=82',
    alt: 'Смартфони',
  },
  noutbuky: {
    description: 'Для роботи та навчання',
    glow: 'magenta',
    image:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=82',
    alt: 'Ноутбук',
  },
  'tb-audio': {
    description: 'Телевізори, акустика, медіа',
    glow: 'lime',
    image:
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=82',
    alt: 'Телевізор у інтер’єрі',
  },
  pobutova: {
    description: 'Техніка для кухні та дому',
    glow: 'violet',
    image:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=82',
    alt: 'Побутова техніка',
  },
  gadzhety: {
    description: 'Планшети, розумні пристрої',
    glow: 'cyan',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=82',
    alt: 'Гаджети',
  },
  igry: {
    description: 'Консолі, периферія, ігри',
    glow: 'magenta',
    image:
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=82',
    alt: 'Ігрова консоль',
  },
  'dlya-domu': {
    description: 'Декор, комфорт, організація',
    glow: 'lime',
    image:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=82',
    alt: 'Інтер’єр дому',
  },
  avto: {
    description: 'Електроніка та аксесуари для авто',
    glow: 'violet',
    image:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=82',
    alt: 'Автомобіль',
  },
}

export type CatalogCategoryCard = {
  id: ShopCategoryId
  label: string
  description: string
  glow: CatalogGlow
  image: string
  alt: string
}

export const catalogCategoryCards: CatalogCategoryCard[] = shopCategories.map(
  (c) => ({
    id: c.id,
    label: c.label,
    ...mediaById[c.id],
  }),
)
