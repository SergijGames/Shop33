/**
 * Shop31 — швидкі пресети пошуку з адмінки (localStorage).
 * Зв’язки: AdminSearchPage, SearchPage, HeaderSearch (за потреби)
 */
const KEY = 'shop31_search_presets_v1'

export type SearchPreset = {
  id: string
  label: string
  query: string
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

export function createSearchPresetId(): string {
  const r = Math.random().toString(36).slice(2, 7)
  return `sp-${Date.now().toString(36)}-${r}`
}

function parseOne(raw: unknown): SearchPreset | null {
  if (!isRecord(raw)) return null
  const id = typeof raw.id === 'string' ? raw.id : ''
  const label = typeof raw.label === 'string' ? raw.label.trim() : ''
  const query = typeof raw.query === 'string' ? raw.query.trim() : ''
  if (!label || !query) return null
  return {
    id: id.startsWith('sp-') ? id : createSearchPresetId(),
    label: label.slice(0, 120),
    query: query.slice(0, 500),
  }
}

export function loadSearchPresets(): SearchPreset[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const p: unknown = JSON.parse(raw)
    if (!Array.isArray(p)) return []
    return p.map(parseOne).filter((x): x is SearchPreset => x !== null)
  } catch {
    return []
  }
}

export function saveSearchPresets(list: SearchPreset[]): void {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function upsertSearchPreset(preset: SearchPreset): void {
  const list = loadSearchPresets()
  const i = list.findIndex((x) => x.id === preset.id)
  if (i >= 0) list[i] = preset
  else list.push(preset)
  saveSearchPresets(list)
}

export function deleteSearchPreset(id: string): void {
  saveSearchPresets(loadSearchPresets().filter((x) => x.id !== id))
}
