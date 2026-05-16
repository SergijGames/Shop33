/**
 * Shop31 — адмін: зовнішній вигляд каталогу (hero, порядок категорій).
 * Зв’язки: adminCatalogUiStorage, catalogDisplay, catalogCategories
 */
import { useState, type FormEvent } from 'react'
import type {
  CatalogUiPrefs,
  CategoryUiOverride,
} from '../../shop/adminCatalogUiStorage'
import { loadCatalogUiPrefs, saveCatalogUiPrefs } from '../../shop/adminCatalogUiStorage'
import { AdminCatalogCategoriesSection } from './AdminCatalogCategoriesSection'
import { AdminCatalogQuickProductForm } from './AdminCatalogQuickProductForm'
import { AdminUserCatalogsSection } from './AdminUserCatalogsSection'

const STORAGE_KEY = 'shop31_admin_catalog_ui_v1'

function buildCleanPrefs(d: CatalogUiPrefs): CatalogUiPrefs {
  const out: CatalogUiPrefs = {}
  if (d.heroTitle?.trim()) out.heroTitle = d.heroTitle.trim()
  if (d.heroLead?.trim()) out.heroLead = d.heroLead.trim()
  if (d.heroCredit?.trim()) out.heroCredit = d.heroCredit.trim()
  if (d.allCardLabel?.trim()) out.allCardLabel = d.allCardLabel.trim()
  if (d.allCardDesc?.trim()) out.allCardDesc = d.allCardDesc.trim()
  const cats: NonNullable<CatalogUiPrefs['categories']> = {}
  if (d.categories) {
    for (const [id, o] of Object.entries(d.categories)) {
      if (!o) continue
      const clean: CategoryUiOverride = {}
      if (o.label?.trim()) clean.label = o.label.trim()
      if (o.description?.trim()) clean.description = o.description.trim()
      if (o.image?.trim()) clean.image = o.image.trim()
      if (o.alt?.trim()) clean.alt = o.alt.trim()
      if (Object.keys(clean).length) cats[id] = clean
    }
  }
  if (Object.keys(cats).length) out.categories = cats
  if (d.hiddenCategoryIds?.length) out.hiddenCategoryIds = d.hiddenCategoryIds
  if (d.customCategories?.length) out.customCategories = d.customCategories
  return out
}

export function AdminCatalogPage() {
  const [prefs, setPrefs] = useState<CatalogUiPrefs>(() => loadCatalogUiPrefs())
  const [savedMsg, setSavedMsg] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = buildCleanPrefs(prefs)
    saveCatalogUiPrefs(clean)
    setPrefs(clean)
    setSavedMsg(true)
    window.setTimeout(() => setSavedMsg(false), 2500)
  }

  function handleResetAll() {
    if (!window.confirm('Скинути всі зміни каталогу до стандартних (з коду)?')) return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setPrefs({})
  }

  return (
    <div className="container admin-dashboard admin-dashboard--products">
      <header className="admin-hero">
        <p className="admin-hero__eyebrow">Вітрина</p>
        <h1 className="admin-dashboard__title admin-hero__title">Каталог</h1>
        <p className="admin-dashboard__lead admin-hero__lead">
          Створюйте товари, редагуйте категорії та підбірки. Порожні поля в «Головному блоці» =
          значення за замовчуванням.
        </p>
      </header>

      <AdminCatalogQuickProductForm />

      <form className="admin-glass admin-product-form" onSubmit={handleSubmit}>
        <h2 className="admin-glass__title">Головний блок</h2>
        <div className="admin-product-form__grid">
          <label className="admin-field admin-field--wide">
            <span>Заголовок (H1)</span>
            <input
              className="auth-field__input"
              value={prefs.heroTitle ?? ''}
              onChange={(e) => setPrefs((p) => ({ ...p, heroTitle: e.target.value }))}
              placeholder="Каталог"
            />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Підзаголовок</span>
            <textarea
              className="auth-field__input admin-textarea"
              rows={3}
              value={prefs.heroLead ?? ''}
              onChange={(e) => setPrefs((p) => ({ ...p, heroLead: e.target.value }))}
              placeholder="Текст під заголовком…"
            />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Рядок «кредиту» замість посилання на Unsplash (plain text)</span>
            <input
              className="auth-field__input"
              value={prefs.heroCredit ?? ''}
              onChange={(e) => setPrefs((p) => ({ ...p, heroCredit: e.target.value }))}
              placeholder="Залиште порожнім — покажемо стандартне «Фото: Unsplash»"
            />
          </label>
        </div>

        <h2 className="admin-glass__title" style={{ marginTop: '1.5rem' }}>
          Картка «Усі товари»
        </h2>
        <div className="admin-product-form__grid">
          <label className="admin-field">
            <span>Назва</span>
            <input
              className="auth-field__input"
              value={prefs.allCardLabel ?? ''}
              onChange={(e) => setPrefs((p) => ({ ...p, allCardLabel: e.target.value }))}
              placeholder="Усі товари"
            />
          </label>
          <label className="admin-field">
            <span>Опис</span>
            <input
              className="auth-field__input"
              value={prefs.allCardDesc ?? ''}
              onChange={(e) => setPrefs((p) => ({ ...p, allCardDesc: e.target.value }))}
              placeholder="Показати весь асортимент"
            />
          </label>
        </div>

        <div className="admin-product-form__actions" style={{ marginTop: '1.25rem' }}>
          <button type="submit" className="admin-btn-primary">
            Зберегти головний блок
          </button>
          <button type="button" className="admin-btn-danger admin-btn-ghost" onClick={handleResetAll}>
            Скинути все
          </button>
        </div>
        {savedMsg ? (
          <p className="product-page__review-saved" role="status">
            Збережено в localStorage.
          </p>
        ) : null}
      </form>

      <AdminCatalogCategoriesSection />

      <AdminUserCatalogsSection />
    </div>
  )
}
