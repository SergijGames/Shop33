/**
 * Shop31 — UI-налаштування сторінки пошуку (підказка тощо), localStorage.
 * Зв’язки: AdminSearchPage, searchProducts.ts, SearchPage
 */
const KEY = 'shop31_admin_search_ui_v1'

export type SearchUiPrefs = {
  /** Підказка на сторінці /search без запиту */
  hintText?: string
  /** Додаткові групи синонімів для пошуку (JSON string[][] при збереженні) */
  extraSynonymGroups?: string[][]
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

function sanitizeGroups(raw: unknown): string[][] {
  if (!Array.isArray(raw)) return []
  const out: string[][] = []
  for (const g of raw) {
    if (!Array.isArray(g)) continue
    const terms = g
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim().toLowerCase().slice(0, 80))
    if (terms.length >= 2) out.push(terms)
  }
  return out
}

export function loadSearchUiPrefs(): SearchUiPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const p: unknown = JSON.parse(raw)
    if (!isRecord(p)) return {}
    const out: SearchUiPrefs = {}
    if (typeof p.hintText === 'string') out.hintText = p.hintText.slice(0, 4000)
    out.extraSynonymGroups = sanitizeGroups(p.extraSynonymGroups)
    return out
  } catch {
    return {}
  }
}

export function saveSearchUiPrefs(prefs: SearchUiPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}

/** Парсинг з textarea: кожен рядок — група, слова через кому */
export function parseSynonymGroupsFromText(text: string): string[][] {
  const out: string[][] = []
  for (const line of text.split('\n')) {
    const parts = line
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    if (parts.length >= 2) out.push(parts)
  }
  return out
}

export function synonymGroupsToText(groups: string[][]): string {
  return groups.map((g) => g.join(', ')).join('\n')
}
