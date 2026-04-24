/**
 * Shop31 — адмін: підбірки товарів для користувачів (окремі «каталоги»).
 * Зв’язки: adminUserCatalogsStorage, products, catalogCategories (glow)
 */
import { useCallback, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { CatalogGlow } from '../../data/catalogCategories'
import { products } from '../../data/products'
import {
  createUserCatalogId,
  deleteUserCatalog,
  loadUserCatalogs,
  upsertUserCatalog,
  type UserCatalog,
} from '../../shop/adminUserCatalogsStorage'

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80'

const GLOWS: CatalogGlow[] = ['cyan', 'magenta', 'lime', 'violet']

function parseProductIds(text: string): string[] {
  const parts = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set(parts)]
}

const emptyForm = () => ({
  title: '',
  description: '',
  image: DEFAULT_IMG,
  alt: '',
  glow: 'cyan' as CatalogGlow,
  productIdsText: '',
})

export function AdminUserCatalogsSection() {
  const [list, setList] = useState(loadUserCatalogs)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [msg, setMsg] = useState(false)

  const refresh = useCallback(() => setList(loadUserCatalogs()), [])

  function startNew() {
    setEditingId(null)
    setForm(emptyForm())
  }

  function startEdit(c: UserCatalog) {
    setEditingId(c.id)
    setForm({
      title: c.title,
      description: c.description,
      image: c.image,
      alt: c.alt,
      glow: c.glow,
      productIdsText: c.productIds.join('\n'),
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const title = form.title.trim()
    if (title.length < 1) return
    const productIds = parseProductIds(form.productIdsText)
    if (productIds.length < 1) {
      window.alert('Додайте хоча б один id товару.')
      return
    }
    const catalog: UserCatalog = {
      id: editingId ?? createUserCatalogId(),
      title: title.slice(0, 200),
      description: form.description.trim().slice(0, 500),
      image: form.image.trim() || DEFAULT_IMG,
      alt: form.alt.trim().slice(0, 200) || title.slice(0, 120),
      glow: form.glow,
      productIds,
    }
    upsertUserCatalog(catalog)
    refresh()
    startNew()
    setMsg(true)
    window.setTimeout(() => setMsg(false), 2000)
  }

  function handleDelete(id: string) {
    if (!window.confirm('Видалити цю підбірку?')) return
    deleteUserCatalog(id)
    refresh()
    if (editingId === id) startNew()
  }

  const joined = products.map((p) => p.id).join(', ')
  const codeIds = joined.length > 200 ? `${joined.slice(0, 200)}…` : joined

  return (
    <section className="admin-glass admin-product-form" style={{ marginTop: '28px' }}>
      <h2 className="admin-glass__title">Нові каталоги (підбірки)</h2>
      <p className="admin-panel__note admin-panel__note--tight">
        Окремі сторінки з обраними товарами. Посилання:{' '}
        <code className="admin-code">/catalog/u-…</code>. У списку id вкажіть через кому або з
        нового рядка (лише товари, що є на вітрині). Приклади id з коду:{' '}
        <span style={{ wordBreak: 'break-all', fontSize: '11px', opacity: 0.85 }}>{codeIds}</span>
      </p>

      {list.length > 0 ? (
        <ul className="admin-user-catalog-list">
          {list.map((c) => (
            <li key={c.id} className="admin-user-catalog-row">
              <div>
                <strong>{c.title}</strong>
                <div>
                  <code className="admin-code">{c.id}</code> · {c.productIds.length} id у списку
                </div>
              </div>
              <div className="admin-user-catalog-row__actions">
                <Link to={`/catalog/${c.id}`} className="admin-btn-ghost admin-btn-ghost--sm">
                  Відкрити
                </Link>
                <button
                  type="button"
                  className="admin-btn-ghost admin-btn-ghost--sm"
                  onClick={() => startEdit(c)}
                >
                  Змінити
                </button>
                <button
                  type="button"
                  className="admin-btn-danger admin-btn-ghost--sm"
                  onClick={() => handleDelete(c.id)}
                >
                  Видалити
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <h3 className="admin-glass__title" style={{ fontSize: '1rem', marginTop: '1rem' }}>
        {editingId ? 'Редагувати підбірку' : 'Нова підбірка'}
      </h3>
      <form className="admin-product-form__grid" onSubmit={handleSubmit}>
        <label className="admin-field admin-field--wide">
          <span>Назва *</span>
          <input
            className="auth-field__input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </label>
        <label className="admin-field admin-field--wide">
          <span>Короткий опис</span>
          <input
            className="auth-field__input"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>
        <label className="admin-field">
          <span>Підсвічування картки</span>
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
          <span>URL зображення картки</span>
          <input
            className="auth-field__input"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
          />
        </label>
        <label className="admin-field admin-field--wide">
          <span>Alt для фото</span>
          <input
            className="auth-field__input"
            value={form.alt}
            onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
          />
        </label>
        <label className="admin-field admin-field--wide">
          <span>ID товарів (через кому або з нового рядка) *</span>
          <textarea
            className="auth-field__input admin-textarea"
            rows={5}
            value={form.productIdsText}
            onChange={(e) => setForm((f) => ({ ...f, productIdsText: e.target.value }))}
            placeholder="iphone-17-pro-256-cosmic-orange"
          />
        </label>
        <div className="admin-product-form__actions">
          <button type="submit" className="admin-btn-primary">
            {editingId ? 'Зберегти підбірку' : 'Створити підбірку'}
          </button>
          {editingId ? (
            <button type="button" className="admin-btn-ghost" onClick={startNew}>
              Нова замість цієї
            </button>
          ) : null}
        </div>
        {msg ? (
          <p className="product-page__review-saved" role="status">
            Підбірку збережено.
          </p>
        ) : null}
      </form>
    </section>
  )
}
