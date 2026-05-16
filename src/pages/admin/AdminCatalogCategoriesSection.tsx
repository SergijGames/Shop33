/**
 * Shop31 — адмін: категорії каталогу (редагування, видалення, нові).
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../api/client'
import type { CatalogGlow } from '../../data/catalogCategories'
import { catalogCategoryCards } from '../../data/catalogCategories'
import { shopCategories } from '../../data/shopCategories'
import { useAuth } from '../../context/AuthContext'
import {
  deleteCustomCategory,
  hideBuiltInCategory,
  loadCatalogUiPrefs,
  restoreBuiltInCategory,
  saveCatalogUiPrefs,
  slugifyCategoryId,
  upsertCustomCategory,
  type CatalogUiPrefs,
  type CategoryUiOverride,
  type CustomCategoryDef,
} from '../../shop/adminCatalogUiStorage'

const GLOWS: CatalogGlow[] = ['cyan', 'magenta', 'lime', 'violet']
const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80'

type ApiCategory = {
  id: string
  slug: string
  labelUk: string
  labelEn: string
  sort: number
}

type ListedCategory = {
  key: string
  id: string
  label: string
  source: 'builtin' | 'custom' | 'api'
  hidden: boolean
  apiId?: string
}

const emptyForm = () => ({
  id: '',
  label: '',
  labelEn: '',
  description: '',
  image: DEFAULT_IMG,
  alt: '',
  glow: 'cyan' as CatalogGlow,
  sort: 0,
})

function defaultMedia(id: string) {
  return catalogCategoryCards.find((c) => c.id === id)
}

export function AdminCatalogCategoriesSection() {
  const { token } = useAuth()
  const [prefs, setPrefs] = useState<CatalogUiPrefs>(() => loadCatalogUiPrefs())
  const [apiCats, setApiCats] = useState<ApiCategory[]>([])
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [msg, setMsg] = useState(false)
  const [isNew, setIsNew] = useState(false)

  const refreshPrefs = useCallback(() => setPrefs(loadCatalogUiPrefs()), [])

  const loadApi = useCallback(async () => {
    if (!token) {
      setApiCats([])
      return
    }
    const r = await apiFetch<{ ok: true; categories: ApiCategory[] }>('/api/admin/categories', {
      token,
    })
    if (r.ok) setApiCats(r.data.categories)
  }, [token])

  useEffect(() => {
    void loadApi()
  }, [loadApi])

  const listed: ListedCategory[] = (() => {
    const hidden = new Set(prefs.hiddenCategoryIds ?? [])
    const rows: ListedCategory[] = []

    for (const c of shopCategories) {
      rows.push({
        key: `builtin-${c.id}`,
        id: c.id,
        label: prefs.categories?.[c.id]?.label?.trim() || c.label,
        source: 'builtin',
        hidden: hidden.has(c.id),
      })
    }

    for (const c of prefs.customCategories ?? []) {
      rows.push({
        key: `custom-${c.id}`,
        id: c.id,
        label: prefs.categories?.[c.id]?.label?.trim() || c.label,
        source: 'custom',
        hidden: false,
      })
    }

    for (const c of apiCats) {
      if (rows.some((r) => r.id === c.slug)) continue
      rows.push({
        key: `api-${c.id}`,
        id: c.slug,
        label: c.labelUk,
        source: 'api',
        hidden: false,
        apiId: c.id,
      })
    }

    return rows
  })()

  function persistPrefs(next: CatalogUiPrefs) {
    saveCatalogUiPrefs(next)
    setPrefs(next)
    setMsg(true)
    window.setTimeout(() => setMsg(false), 2000)
  }

  function setOverride(id: string, patch: CategoryUiOverride) {
    const next: CatalogUiPrefs = {
      ...prefs,
      categories: { ...prefs.categories, [id]: { ...prefs.categories?.[id], ...patch } },
    }
    persistPrefs(next)
  }

  function startNew() {
    setIsNew(true)
    setEditingKey(null)
    setForm(emptyForm())
  }

  function startEdit(row: ListedCategory) {
    setIsNew(false)
    setEditingKey(row.key)
    const o = prefs.categories?.[row.id] ?? {}
    const custom = prefs.customCategories?.find((c) => c.id === row.id)
    const base = defaultMedia(row.id)
    const api = apiCats.find((c) => c.slug === row.id)
    setForm({
      id: row.id,
      label: o.label?.trim() || custom?.label || api?.labelUk || row.label,
      labelEn: api?.labelEn ?? row.label,
      description: o.description?.trim() || custom?.description || base?.description || '',
      image: o.image?.trim() || custom?.image || base?.image || DEFAULT_IMG,
      alt: o.alt?.trim() || custom?.alt || base?.alt || row.label,
      glow: custom?.glow || base?.glow || 'cyan',
      sort: api?.sort ?? 0,
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const label = form.label.trim()
    if (!label) return

    const id = isNew ? slugifyCategoryId(form.id.trim() || label) : form.id.trim()
    if (!id) return

    if (isNew) {
      const exists =
        shopCategories.some((c) => c.id === id) ||
        (prefs.customCategories ?? []).some((c) => c.id === id) ||
        apiCats.some((c) => c.slug === id)
      if (exists) {
        window.alert('Категорія з таким id вже є.')
        return
      }

      const custom: CustomCategoryDef = {
        id,
        label: label.slice(0, 120),
        description: form.description.trim().slice(0, 300),
        image: form.image.trim() || DEFAULT_IMG,
        alt: form.alt.trim().slice(0, 200) || label,
        glow: form.glow,
      }
      upsertCustomCategory(custom)
      refreshPrefs()

      if (token) {
        await apiFetch('/api/admin/categories', {
          method: 'POST',
          token,
          body: JSON.stringify({
            slug: id,
            labelUk: label,
            labelEn: form.labelEn.trim() || label,
            sort: form.sort,
          }),
        })
        await loadApi()
      }
    } else {
      const row = listed.find((r) => r.key === editingKey)
      if (!row) return

      setOverride(id, {
        label: label.slice(0, 120),
        description: form.description.trim().slice(0, 300),
        image: form.image.trim(),
        alt: form.alt.trim().slice(0, 200),
      })

      if (row.source === 'custom') {
        const prev = prefs.customCategories?.find((c) => c.id === id)
        if (prev) {
          upsertCustomCategory({
            ...prev,
            label: label.slice(0, 120),
            description: form.description.trim().slice(0, 300),
            image: form.image.trim() || DEFAULT_IMG,
            alt: form.alt.trim().slice(0, 200) || label,
            glow: form.glow,
          })
          refreshPrefs()
        }
      }

      if (token && row.apiId) {
        await apiFetch(`/api/admin/categories/${row.apiId}`, {
          method: 'PUT',
          token,
          body: JSON.stringify({
            slug: id,
            labelUk: label,
            labelEn: form.labelEn.trim() || label,
            sort: form.sort,
          }),
        })
        await loadApi()
      }
    }

    startNew()
  }

  async function handleDelete(row: ListedCategory) {
    if (!window.confirm(`Видалити категорію «${row.label}»?`)) return

    if (row.source === 'builtin') {
      hideBuiltInCategory(row.id)
      refreshPrefs()
      if (editingKey === row.key) startNew()
      return
    }

    if (row.source === 'custom') {
      deleteCustomCategory(row.id)
      refreshPrefs()
    }

    if (token && row.apiId) {
      await apiFetch(`/api/admin/categories/${row.apiId}`, { method: 'DELETE', token })
      await loadApi()
    }

    if (editingKey === row.key) startNew()
  }

  function handleRestore(row: ListedCategory) {
    restoreBuiltInCategory(row.id)
    refreshPrefs()
  }

  return (
    <section className="admin-glass admin-product-form" style={{ marginTop: '1.5rem' }}>
      <h2 className="admin-glass__title">Категорії каталогу</h2>
      <p className="admin-panel__note admin-panel__note--tight">
        Редагуйте, приховуйте або додавайте категорії. Підбірки — у блоці нижче.
      </p>

      <div className="admin-product-form__actions" style={{ marginBottom: '1rem' }}>
        <button type="button" className="admin-btn-primary admin-btn-ghost--sm" onClick={startNew}>
          + Нова категорія
        </button>
      </div>

      {listed.length > 0 ? (
        <ul className="admin-user-catalog-list">
          {listed.map((row) => (
            <li
              key={row.key}
              className={`admin-user-catalog-row${row.hidden ? ' admin-user-catalog-row--muted' : ''}`}
            >
              <div>
                <strong>{row.label}</strong>
                {row.hidden ? <span className="admin-badge-edit"> приховано</span> : null}
                <div>
                  <code className="admin-code">{row.id}</code>
                  {' · '}
                  {row.source === 'api' ? 'сервер' : row.source === 'custom' ? 'локальна' : 'базова'}
                </div>
              </div>
              <div className="admin-user-catalog-row__actions">
                <Link to={`/catalog/${row.id}`} className="admin-btn-ghost admin-btn-ghost--sm">
                  Відкрити
                </Link>
                <button
                  type="button"
                  className="admin-btn-ghost admin-btn-ghost--sm"
                  onClick={() => startEdit(row)}
                >
                  Змінити
                </button>
                {row.hidden ? (
                  <button
                    type="button"
                    className="admin-btn-ghost admin-btn-ghost--sm"
                    onClick={() => handleRestore(row)}
                  >
                    Показати
                  </button>
                ) : (
                  <button
                    type="button"
                    className="admin-btn-danger admin-btn-ghost--sm"
                    onClick={() => void handleDelete(row)}
                  >
                    Видалити
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-panel__empty">Немає категорій. Додайте нову.</p>
      )}

      <h3 className="admin-glass__title" style={{ fontSize: '1rem', marginTop: '1rem' }}>
        {isNew ? 'Нова категорія' : editingKey ? 'Редагувати категорію' : 'Нова категорія'}
      </h3>
      <form className="admin-product-form__grid" onSubmit={(ev) => void handleSubmit(ev)}>
        {isNew ? (
          <label className="admin-field admin-field--wide">
            <span>ID (латиницею, необов’язково)</span>
            <input
              className="auth-field__input"
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              placeholder="napriklad-aksesuary"
            />
          </label>
        ) : (
          <label className="admin-field admin-field--wide">
            <span>ID</span>
            <input className="auth-field__input" value={form.id} readOnly />
          </label>
        )}
        <label className="admin-field admin-field--wide">
          <span>Назва (UK) *</span>
          <input
            className="auth-field__input"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            required
          />
        </label>
        <label className="admin-field admin-field--wide">
          <span>Назва (EN)</span>
          <input
            className="auth-field__input"
            value={form.labelEn}
            onChange={(e) => setForm((f) => ({ ...f, labelEn: e.target.value }))}
          />
        </label>
        <label className="admin-field admin-field--wide">
          <span>Опис на картці</span>
          <input
            className="auth-field__input"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>
        <label className="admin-field">
          <span>Підсвічування</span>
          <select
            className="auth-field__input"
            value={form.glow}
            onChange={(e) => setForm((f) => ({ ...f, glow: e.target.value as CatalogGlow }))}
          >
            {GLOWS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field admin-field--wide">
          <span>URL зображення</span>
          <input
            className="auth-field__input"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
          />
        </label>
        <label className="admin-field admin-field--wide">
          <span>Alt</span>
          <input
            className="auth-field__input"
            value={form.alt}
            onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
          />
        </label>
        <label className="admin-field">
          <span>Сортування (API)</span>
          <input
            className="auth-field__input"
            type="number"
            value={form.sort}
            onChange={(e) => setForm((f) => ({ ...f, sort: Number(e.target.value) || 0 }))}
          />
        </label>
        <div className="admin-product-form__actions">
          <button type="submit" className="admin-btn-primary">
            {isNew ? 'Створити' : 'Зберегти'}
          </button>
          {editingKey || isNew ? (
            <button type="button" className="admin-btn-ghost" onClick={startNew}>
              Скасувати
            </button>
          ) : null}
        </div>
        {msg ? (
          <p className="product-page__review-saved admin-field--wide" role="status">
            Збережено.
          </p>
        ) : null}
      </form>
    </section>
  )
}
