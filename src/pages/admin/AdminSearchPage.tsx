/**
 * Shop31 — адмін: пресети пошуку та текст підказки на /search.
 * Зв’язки: adminSearchPresetsStorage, adminSearchUiStorage
 */
import { useMemo, useState, type FormEvent } from 'react'
import {
  createSearchPresetId,
  deleteSearchPreset,
  loadSearchPresets,
  upsertSearchPreset,
  type SearchPreset,
} from '../../shop/adminSearchPresetsStorage'
import {
  loadSearchUiPrefs,
  parseSynonymGroupsFromText,
  saveSearchUiPrefs,
  synonymGroupsToText,
  type SearchUiPrefs,
} from '../../shop/adminSearchUiStorage'

const STORAGE_KEY = 'shop31_admin_search_ui_v1'
const PRESETS_KEY = 'shop31_search_presets_v1'

export function AdminSearchPage() {
  const initial = loadSearchUiPrefs()
  const [hint, setHint] = useState(initial.hintText ?? '')
  const [synText, setSynText] = useState(
    synonymGroupsToText(initial.extraSynonymGroups ?? []),
  )
  const [savedMsg, setSavedMsg] = useState(false)
  const [presetTick, setPresetTick] = useState(0)
  const presets = useMemo(() => loadSearchPresets(), [presetTick])
  const [presetLabel, setPresetLabel] = useState('')
  const [presetQuery, setPresetQuery] = useState('')
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const groups = parseSynonymGroupsFromText(synText)
    const next: SearchUiPrefs = {}
    if (hint.trim()) next.hintText = hint.trim()
    if (groups.length) next.extraSynonymGroups = groups
    saveSearchUiPrefs(next)
    setHint(next.hintText ?? '')
    setSynText(synonymGroupsToText(next.extraSynonymGroups ?? []))
    setSavedMsg(true)
    window.setTimeout(() => setSavedMsg(false), 2500)
  }

  function handleReset() {
    if (!window.confirm('Скинути власний текст підказки та додаткові синоніми?')) return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setHint('')
    setSynText('')
  }

  function handlePresetSubmit(e: FormEvent) {
    e.preventDefault()
    const label = presetLabel.trim()
    const query = presetQuery.trim()
    if (!label || !query) return
    const preset: SearchPreset = {
      id: editingPresetId ?? createSearchPresetId(),
      label: label.slice(0, 120),
      query: query.slice(0, 500),
    }
    upsertSearchPreset(preset)
    setPresetTick((n) => n + 1)
    setPresetLabel('')
    setPresetQuery('')
    setEditingPresetId(null)
  }

  function startEditPreset(p: SearchPreset) {
    setEditingPresetId(p.id)
    setPresetLabel(p.label)
    setPresetQuery(p.query)
  }

  function cancelEditPreset() {
    setEditingPresetId(null)
    setPresetLabel('')
    setPresetQuery('')
  }

  function handleDeletePreset(id: string) {
    if (!window.confirm('Видалити цей швидкий пошук?')) return
    deleteSearchPreset(id)
    setPresetTick((n) => n + 1)
    if (editingPresetId === id) cancelEditPreset()
  }

  function handleResetPresets() {
    if (!window.confirm('Видалити всі збережені швидкі пошуки?')) return
    try {
      localStorage.removeItem(PRESETS_KEY)
    } catch {
      /* ignore */
    }
    setPresetTick((n) => n + 1)
    cancelEditPreset()
  }

  return (
    <div className="container admin-dashboard admin-dashboard--products">
      <header className="admin-hero">
        <p className="admin-hero__eyebrow">Вітрина</p>
        <h1 className="admin-dashboard__title admin-hero__title">Пошук</h1>
        <p className="admin-dashboard__lead admin-hero__lead">
          Текст підказки, синоніми, а також кнопки «Швидко» на сторінці пошуку з готовими запитами.
        </p>
      </header>

      <section className="admin-glass admin-product-form" style={{ marginBottom: '24px' }}>
        <h2 className="admin-glass__title">Швидкі пошуки (нові)</h2>
        <p className="admin-panel__note admin-panel__note--tight">
          З’являються на <code className="admin-code">/search</code> над підказкою. Клік веде на
          пошук із заповненим запитом.
        </p>
        {presets.length > 0 ? (
          <ul className="admin-search-preset-list">
            {presets.map((p) => (
              <li key={p.id} className="admin-search-preset-row">
                <div>
                  <strong>{p.label}</strong>
                  <div>
                    <code className="admin-code">{p.query}</code>
                  </div>
                </div>
                <div className="admin-user-catalog-row__actions">
                  <button
                    type="button"
                    className="admin-btn-ghost admin-btn-ghost--sm"
                    onClick={() => startEditPreset(p)}
                  >
                    Змінити
                  </button>
                  <button
                    type="button"
                    className="admin-btn-danger admin-btn-ghost--sm"
                    onClick={() => handleDeletePreset(p.id)}
                  >
                    Видалити
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <form className="admin-product-form__grid" onSubmit={handlePresetSubmit}>
          <label className="admin-field">
            <span>Назва кнопки</span>
            <input
              className="auth-field__input"
              value={presetLabel}
              onChange={(e) => setPresetLabel(e.target.value)}
              placeholder="Наприклад, Смартфони Apple"
            />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Текст запиту</span>
            <input
              className="auth-field__input"
              value={presetQuery}
              onChange={(e) => setPresetQuery(e.target.value)}
              placeholder="iphone apple"
            />
          </label>
          <div className="admin-product-form__actions">
            <button type="submit" className="admin-btn-primary">
              {editingPresetId ? 'Зберегти' : 'Додати швидкий пошук'}
            </button>
            {editingPresetId ? (
              <button type="button" className="admin-btn-ghost" onClick={cancelEditPreset}>
                Скасувати
              </button>
            ) : null}
            {presets.length > 0 ? (
              <button type="button" className="admin-btn-danger admin-btn-ghost" onClick={handleResetPresets}>
                Очистити всі
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <form className="admin-glass admin-product-form" onSubmit={handleSubmit}>
        <label className="admin-field admin-field--wide">
          <span>Підказка для покупця</span>
          <textarea
            className="auth-field__input admin-textarea"
            rows={5}
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Залиште порожнім — стандартний текст з коду"
          />
        </label>

        <label className="admin-field admin-field--wide">
          <span>
            Додаткові синоніми — кожен рядок окрема група, слова через кому (мінімум 2 слова в
            рядку)
          </span>
          <textarea
            className="auth-field__input admin-textarea"
            rows={8}
            value={synText}
            onChange={(e) => setSynText(e.target.value)}
            placeholder={'iphone 17, айфон 17, seventeen\nгеймерський, gaming laptop'}
          />
        </label>

        <p className="admin-panel__note admin-panel__note--tight">
          Пошук також дивиться назву, spec, тег, опис і назву категорії (з урахуванням ваших назв з
          розділу «Каталог»).
        </p>

        <div className="admin-product-form__actions">
          <button type="submit" className="admin-btn-primary">
            Зберегти пошук
          </button>
          <button type="button" className="admin-btn-danger admin-btn-ghost" onClick={handleReset}>
            Скинути
          </button>
        </div>
        {savedMsg ? (
          <p className="product-page__review-saved" role="status">
            Збережено в localStorage.
          </p>
        ) : null}
      </form>
    </div>
  )
}
