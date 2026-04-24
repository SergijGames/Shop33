/**
 * Shop31 — пошук по каталогу (токени, синоніми, UK/EN назва категорії).
 * Зв’язки: SearchPage, HeaderSearch, adminSearchUiStorage, catalogDisplay
 */
import type { Product } from '../data/products'
import { getCategoryDisplayLabel } from '../data/catalogDisplay'
import { loadSearchUiPrefs } from '../shop/adminSearchUiStorage'

/**
 * Групи синонімів / схожих понять (українська + латиниця).
 * Якщо запит збігається з одним членом, а в товарі є інший з тієї ж групи — це match.
 */
const BASE_SYNONYM_GROUPS: readonly (readonly string[])[] = [
  [
    'смартфон',
    'смартфони',
    'телефон',
    'телефони',
    'мобільний',
    'мобильный',
    'мобілка',
    'мобила',
    'айфон',
    'iphone',
    'android',
    'андроїд',
    'смарт',
    'samsung',
    'самсунг',
    'galaxy',
    'галаксі',
    'apple',
    'епл',
  ],
  ['ноутбук', 'ноутбуки', 'лаптоп', 'laptop', 'нетбук', 'macbook', 'макбук', 'ноут'],
  [
    'навушники',
    'навушник',
    'tws',
    'бездротові',
    'беспроводные',
    'аудіо',
    'гарнітура',
    'гарнитура',
    'звук',
  ],
  [
    'телевізор',
    'телевізори',
    'телевизор',
    'тб',
    'tb',
    'tv',
    'oled',
    'qled',
    'екран',
    'дисплей',
    'аудіо',
    'аудио',
    'audio',
    'звук',
  ],
  [
    'пилосос',
    'пилососи',
    'робот-пилосос',
    'робот',
    'пилосос-робот',
    'vacuum',
    'прибирання',
    'уборка',
  ],
  ['планшет', 'планшети', 'tablet', 'ipad', 'айпад', 'tab'],
  [
    'миша',
    'мишка',
    'мышь',
    'mouse',
    'gaming',
    'ігрова',
    'игровая',
    'rgb',
    'периферія',
    'периферия',
  ],
  [
    'консоль',
    'консолі',
    'консоли',
    'playstation',
    'ps5',
    'ps4',
    'xbox',
    'nintendo',
    'switch',
    'геймпад',
    'геймпади',
    'джойстик',
    'ігри',
    'игры',
    'гейминг',
  ],
  [
    'караоке',
    'karaoke',
    'колонка',
    'колонки',
    'акустика',
    'динамік',
    'динамик',
    'музика',
    'музыка',
    'спікер',
    'party',
  ],
  [
    'побутова',
    'побутовая',
    'техніка',
    'техника',
    'прилад',
    'прибор',
    'кухня',
    'бытовая',
  ],
  ['гаджет', 'гаджети', 'гаджеты', 'розумний', 'умный', 'smart', 'девайс', 'device'],
  ['дім', 'дом', 'для дому', 'інтер’єр', 'интерьер', 'побут'],
  ['авто', 'автомобіль', 'автомобиль', 'машина', 'car', 'автомобільний'],
  ['камера', 'відео', 'фото', 'об’єктив'],
  ['зарядка', 'зарядний', 'powerbank', 'повербанк', 'батарея', 'акумулятор'],
]

function getSynonymGroups(): readonly string[][] {
  const extra = loadSearchUiPrefs().extraSynonymGroups ?? []
  return [...BASE_SYNONYM_GROUPS.map((g) => [...g]), ...extra]
}

function productHaystack(p: Product): string {
  const catUk = getCategoryDisplayLabel(p.categoryId, 'uk')
  const catEn = getCategoryDisplayLabel(p.categoryId, 'en')
  return `${p.name} ${p.spec ?? ''} ${p.tag} ${catUk} ${catEn} ${p.description}`.toLowerCase()
}

/** Чи пов’язане слово з членом групи (захист від дуже коротких випадкових збігів) */
function termRelatesToGroup(term: string, group: readonly string[]): boolean {
  return group.some((g) => {
    const gt = g.toLowerCase()
    const te = term.toLowerCase()
    if (te === gt) return true
    if (te.length < 3 || gt.length < 3) return false
    return gt.startsWith(te) || te.startsWith(gt) || gt.includes(te) || te.includes(gt)
  })
}

function haystackTouchesGroup(haystack: string, group: readonly string[]): boolean {
  return group.some((g) => haystack.includes(g.toLowerCase()))
}

/** Одне слово запиту збігається з товаром (пряме входження або через синоніми) */
function queryTermMatches(haystack: string, term: string): boolean {
  const t = term.toLowerCase()
  const h = haystack.toLowerCase()
  if (h.includes(t)) return true

  for (const group of getSynonymGroups()) {
    if (termRelatesToGroup(t, group) && haystackTouchesGroup(h, group)) {
      return true
    }
  }
  return false
}

/** Усі «слова» запиту мають знаходити відповідність у товарі */
export function filterProductsByQuery(
  list: readonly Product[],
  raw: string,
): Product[] {
  const q = raw.trim().toLowerCase()
  if (!q) return [...list]

  const words = q.split(/\s+/).filter(Boolean)
  return list.filter((p) => {
    const h = productHaystack(p)
    return words.every((w) => queryTermMatches(h, w))
  })
}
