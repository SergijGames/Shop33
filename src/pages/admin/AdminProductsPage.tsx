/**
 * Shop31 — адмін: редагування товарів, кастомні позиції, правки «кодом».
 * Зв’язки: adminCodeProductEditsStorage, adminCustomProductsStorage, products, catalog
 */
import { useCallback, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { CatalogPrefs, CatalogOverrides } from '../../data/catalog'
import {
  applyCatalogItemPrefs,
  loadCatalogPrefs,
  purgeProductCatalogPrefs,
  saveCatalogPrefs,
} from '../../data/catalog'
import {
  loadCodeProductEdits,
  removeCodeProductEdit,
  upsertCodeProductEdit,
} from '../../shop/adminCodeProductEditsStorage'
import { shopCategories, type ShopCategoryId } from '../../data/shopCategories'
import {
  createCustomProductId,
  defaultCustomProductImage,
  deleteCustomProduct,
  loadCustomProducts,
  upsertCustomProduct,
} from '../../shop/adminCustomProductsStorage'
import { products, type Product, type ProductReview, type ProductVideo } from '../../data/products'

type FormFields = {
  name: string
  spec: string
  tag: string
  categoryId: ShopCategoryId
  priceUah: string
  oldPriceUah: string
  imageUrl: string
  galleryExtra: string
  description: string
  specsLines: string
  videosLines: string
  reviewsLines: string
}

const emptyForm = (): FormFields => ({
  name: '',
  spec: '',
  tag: 'Новинка',
  categoryId: 'gadzhety',
  priceUah: '',
  oldPriceUah: '',
  imageUrl: defaultCustomProductImage,
  galleryExtra: '',
  description: '',
  specsLines: '',
  videosLines: '',
  reviewsLines: '',
})

function parseSpecsLines(text: string): { label: string; value: string }[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(':')
      if (i === -1) return { label: line.slice(0, 120), value: '' }
      return {
        label: line.slice(0, i).trim().slice(0, 120),
        value: line.slice(i + 1).trim().slice(0, 500),
      }
    })
    .filter((row) => row.label.length > 0)
}

function parseVideosLines(text: string): ProductVideo[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('|')
      if (i === -1) return null
      const title = line.slice(0, i).trim()
      const youtubeId = line.slice(i + 1).trim()
      if (!title || !youtubeId) return null
      return { title: title.slice(0, 200), youtubeId: youtubeId.slice(0, 32) }
    })
    .filter((x): x is ProductVideo => x !== null)
}

function parseReviewsLines(text: string): ProductReview[] {
  const out: ProductReview[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const m = line.match(
      /^(.+?)\s*\|\s*(\d+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)$/,
    )
    if (!m) continue
    const rating = Number(m[2])
    if (!Number.isFinite(rating)) continue
    out.push({
      author: m[1].trim().slice(0, 200),
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      date: m[3],
      text: m[4].trim().slice(0, 4000),
    })
  }
  return out
}

function productToFormFields(p: Product): FormFields {
  return {
    name: p.name,
    spec: p.spec ?? '',
    tag: p.tag,
    categoryId: p.categoryId,
    priceUah: String(p.priceUah),
    oldPriceUah: p.oldPriceUah === null ? '' : String(p.oldPriceUah),
    imageUrl: p.image,
    galleryExtra: p.gallery.filter((u) => u !== p.image).join('\n'),
    description: p.description,
    specsLines: p.specsTable.map((r) => `${r.label}: ${r.value}`).join('\n'),
    videosLines: p.videos.map((v) => `${v.title} | ${v.youtubeId}`).join('\n'),
    reviewsLines: p.reviews
      .map((r) => `${r.author} | ${r.rating} | ${r.date} | ${r.text.replace(/\n/g, ' ')}`)
      .join('\n'),
  }
}

function buildProductFromForm(
  form: FormFields,
  existing: Product | null,
  options?: { forcedId?: string },
): { ok: true; product: Product } | { ok: false; message: string } {
  const name = form.name.trim()
  if (name.length < 2) {
    return { ok: false, message: 'Вкажіть назву товару (мінімум 2 символи).' }
  }
  const priceUah = Math.round(Number(form.priceUah))
  if (!Number.isFinite(priceUah) || priceUah < 0) {
    return { ok: false, message: 'Вкажіть коректну ціну в гривнях.' }
  }
  let oldPriceUah: number | null = null
  if (form.oldPriceUah.trim() !== '') {
    const o = Math.round(Number(form.oldPriceUah))
    if (!Number.isFinite(o) || o < 0) {
      return { ok: false, message: 'Стара ціна має бути числом або порожньою.' }
    }
    oldPriceUah = o
  }
  const image = form.imageUrl.trim() || defaultCustomProductImage
  const extra = form.galleryExtra
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const gallery = [image, ...extra.filter((u) => u !== image)]
  const id = options?.forcedId ?? existing?.id ?? createCustomProductId()
  const videos = parseVideosLines(form.videosLines)
  const reviews = parseReviewsLines(form.reviewsLines)
  const product: Product = {
    id,
    name: name.slice(0, 500),
    spec: form.spec.trim() ? form.spec.trim().slice(0, 300) : undefined,
    priceUah,
    oldPriceUah,
    tag: form.tag.trim().slice(0, 40) || 'Новинка',
    image,
    categoryId: form.categoryId,
    description: form.description.trim().slice(0, 8000) || 'Опис товару.',
    gallery: gallery.length > 0 ? gallery : [image],
    videos,
    specsTable: parseSpecsLines(form.specsLines),
    reviews,
  }
  return { ok: true, product }
}

function patchOverrides(
  base: Product,
  prev: CatalogPrefs,
  id: string,
  patch: CatalogOverrides,
): CatalogPrefs {
  const merged: CatalogOverrides = { ...prev.overrides[id], ...patch }
  const cleaned: CatalogOverrides = {}
  if (merged.name !== undefined && merged.name.trim() !== base.name) {
    cleaned.name = merged.name.trim()
  }
  if (merged.priceUah !== undefined && merged.priceUah !== base.priceUah) {
    cleaned.priceUah = merged.priceUah
  }
  const baseOld = base.oldPriceUah
  if (merged.oldPriceUah !== undefined) {
    const sameAsBase =
      (merged.oldPriceUah === null && baseOld === null) ||
      merged.oldPriceUah === baseOld
    if (!sameAsBase) cleaned.oldPriceUah = merged.oldPriceUah
  }
  const nextOverrides = { ...prev.overrides }
  if (Object.keys(cleaned).length === 0) {
    delete nextOverrides[id]
  } else {
    nextOverrides[id] = cleaned
  }
  return { ...prev, overrides: nextOverrides }
}

export function AdminProductsPage() {
  const [prefs, setPrefs] = useState<CatalogPrefs>(() => loadCatalogPrefs())
  const [customList, setCustomList] = useState(() => loadCustomProducts())
  const [codeEdits, setCodeEdits] = useState(() => loadCodeProductEdits())
  const [form, setForm] = useState<FormFields>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [discountPctDraft, setDiscountPctDraft] = useState<Record<string, string>>({})

  const refreshCustom = useCallback(() => {
    setCustomList(loadCustomProducts())
  }, [])

  const refreshCodeEdits = useCallback(() => {
    setCodeEdits(loadCodeProductEdits())
  }, [])

  const persist = useCallback((next: CatalogPrefs) => {
    saveCatalogPrefs(next)
    setPrefs(next)
  }, [])

  const toggleHidden = (id: string) => {
    const has = prefs.hiddenIds.includes(id)
    const hiddenIds = has ? prefs.hiddenIds.filter((x) => x !== id) : [...prefs.hiddenIds, id]
    persist({ ...prefs, hiddenIds })
  }

  const baseForCodeRow = (p: Product) => codeEdits[p.id] ?? p

  const updateField = (base: Product, field: keyof CatalogOverrides, raw: string) => {
    if (field === 'name') {
      persist(patchOverrides(base, prefs, base.id, { name: raw }))
      return
    }
    if (field === 'priceUah') {
      const n = raw === '' ? NaN : Number(raw)
      if (Number.isNaN(n) || n < 0) return
      persist(patchOverrides(base, prefs, base.id, { priceUah: Math.round(n) }))
      return
    }
    if (field === 'oldPriceUah') {
      if (raw.trim() === '') {
        persist(patchOverrides(base, prefs, base.id, { oldPriceUah: null }))
        return
      }
      const n = Number(raw)
      if (Number.isNaN(n) || n < 0) return
      persist(patchOverrides(base, prefs, base.id, { oldPriceUah: Math.round(n) }))
    }
  }

  function applyPercentDiscount(
    base: Product,
    productId: string,
    listPriceUah: number,
  ) {
    const raw = (discountPctDraft[productId] ?? '').trim()
    const pct = parseInt(raw, 10)
    if (!Number.isFinite(pct) || pct < 1 || pct > 99) {
      window.alert('Вкажіть відсоток знижки від 1 до 99.')
      return
    }
    if (!Number.isFinite(listPriceUah) || listPriceUah <= 0) {
      window.alert('Спочатку вкажіть коректну поточну ціну (від якої рахується знижка).')
      return
    }
    const newPrice = Math.round((listPriceUah * (100 - pct)) / 100)
    if (newPrice >= listPriceUah) {
      window.alert('Після знижки ціна не зменшилась — перевірте відсоток і поточну ціну.')
      return
    }
    persist(
      patchOverrides(base, prefs, productId, {
        priceUah: newPrice,
        oldPriceUah: Math.round(listPriceUah),
      }),
    )
    setDiscountPctDraft((d) => ({ ...d, [productId]: '' }))
  }

  function clearProductDiscount(base: Product, productId: string, strikePriceUah: number | null) {
    if (strikePriceUah === null || strikePriceUah <= 0) return
    persist(
      patchOverrides(base, prefs, productId, {
        priceUah: Math.round(strikePriceUah),
        oldPriceUah: null,
      }),
    )
  }

  function resetQuickOverrides(id: string) {
    if (
      !window.confirm(
        'Скинути лише швидкі зміни (назва/ціни з таблиці)? Повна копія товару в localStorage не зміниться.',
      )
    ) {
      return
    }
    const nextOverrides = { ...prefs.overrides }
    delete nextOverrides[id]
    persist({ ...prefs, overrides: nextOverrides })
  }

  function revertCodeProductToRepo(id: string) {
    if (
      !window.confirm(
        'Повернути товар до даних з коду проєкту? Повна копія з localStorage та швидкі оверрайди будуть видалені.',
      )
    ) {
      return
    }
    removeCodeProductEdit(id)
    const nextOverrides = { ...prefs.overrides }
    delete nextOverrides[id]
    persist({ ...prefs, overrides: nextOverrides })
    refreshCodeEdits()
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (editingCodeId) {
      const code = products.find((x) => x.id === editingCodeId)
      if (!code) return
      const edited = codeEdits[editingCodeId] ?? code
      const existing = applyCatalogItemPrefs(edited, editingCodeId)
      const built = buildProductFromForm(form, existing, { forcedId: editingCodeId })
      if (!built.ok) {
        setFormError(built.message)
        return
      }
      upsertCodeProductEdit(built.product)
      const nextOverrides = { ...prefs.overrides }
      delete nextOverrides[editingCodeId]
      persist({ ...prefs, overrides: nextOverrides })
      refreshCodeEdits()
      setEditingCodeId(null)
      setForm(emptyForm())
      return
    }

    const existing = editingId
      ? customList.find((p) => p.id === editingId) ?? null
      : null
    const built = buildProductFromForm(form, existing)
    if (!built.ok) {
      setFormError(built.message)
      return
    }
    upsertCustomProduct(built.product)
    refreshCustom()
    setEditingId(null)
    setForm(emptyForm())
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setEditingCodeId(null)
    setFormError(null)
    setForm(productToFormFields(p))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startFullEditCode(productId: string) {
    const code = products.find((p) => p.id === productId)
    if (!code) return
    const edited = codeEdits[productId]
    const baseLayer = edited ?? code
    const forForm = applyCatalogItemPrefs(baseLayer, productId)
    setEditingCodeId(productId)
    setEditingId(null)
    setFormError(null)
    setForm(productToFormFields(forForm))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingCodeId(null)
    setForm(emptyForm())
    setFormError(null)
  }

  function handleDeleteCustom(p: Product) {
    if (!window.confirm(`Видалити товар «${p.name}» з магазину?`)) return
    deleteCustomProduct(p.id)
    purgeProductCatalogPrefs(p.id)
    refreshCustom()
    if (editingId === p.id || editingCodeId === p.id) cancelEdit()
  }

  const hiddenSet = new Set(prefs.hiddenIds)

  return (
    <div className="container admin-dashboard admin-dashboard--products">
      <header className="admin-hero">
        <p className="admin-hero__eyebrow">Каталог</p>
        <h1 className="admin-dashboard__title admin-hero__title">Товари</h1>
        <p className="admin-dashboard__lead admin-hero__lead">
          Додавайте власні товари або повністю змінюйте позиції з коду (опис, фото, відео, відгуки,
          характеристики) — копії зберігаються в localStorage. У таблиці — швидка зміна назви та цін;
          колонка «Знижка %» виставляє акційну ціну й перекреслену стару автоматично.
        </p>
      </header>

      <section className="admin-glass admin-product-form">
        <div className="admin-glass__head">
          <h2 className="admin-glass__title">
            {editingCodeId
              ? 'Повне редагування (база з коду)'
              : editingId
                ? 'Редагувати ваш товар'
                : 'Новий товар'}
          </h2>
          <span className="admin-chip admin-chip--pulse">
            {editingCodeId
              ? `ID: ${editingCodeId}`
              : editingId
                ? 'Ваш товар'
                : 'Додати на вітрину'}
          </span>
        </div>
        <form className="admin-product-form__grid" onSubmit={handleFormSubmit}>
          <label className="admin-field">
            <span>Назва *</span>
            <input
              className="auth-field__input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Наприклад, Бездротовий зарядний пристрій 15W"
              required
            />
          </label>
          <label className="admin-field">
            <span>Короткий підзаголовок</span>
            <input
              className="auth-field__input"
              value={form.spec}
              onChange={(e) => setForm((f) => ({ ...f, spec: e.target.value }))}
              placeholder="15W · Qi · чорний"
            />
          </label>
          <label className="admin-field">
            <span>Категорія</span>
            <select
              className="auth-field__input"
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value as ShopCategoryId }))
              }
            >
              {shopCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Бейдж</span>
            <input
              className="auth-field__input"
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
              placeholder="Новинка, Хіт, Акція…"
            />
          </label>
          <label className="admin-field">
            <span>Ціна, ₴ *</span>
            <input
              type="number"
              min={0}
              className="auth-field__input"
              value={form.priceUah}
              onChange={(e) => setForm((f) => ({ ...f, priceUah: e.target.value }))}
              required
            />
          </label>
          <label className="admin-field">
            <span>Стара ціна (необов’язково)</span>
            <input
              type="number"
              min={0}
              className="auth-field__input"
              value={form.oldPriceUah}
              onChange={(e) => setForm((f) => ({ ...f, oldPriceUah: e.target.value }))}
              placeholder="Порожньо — без перекресленої ціни"
            />
          </label>
          <label className="admin-field admin-field--wide">
            <span>URL головного фото *</span>
            <input
              className="auth-field__input"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://…"
            />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Додаткові фото (одне посилання на рядок)</span>
            <textarea
              className="auth-field__input admin-textarea"
              rows={3}
              value={form.galleryExtra}
              onChange={(e) => setForm((f) => ({ ...f, galleryExtra: e.target.value }))}
              placeholder="https://…"
            />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Опис</span>
            <textarea
              className="auth-field__input admin-textarea"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Характеристики (кожен рядок: Назва: значення)</span>
            <textarea
              className="auth-field__input admin-textarea"
              rows={4}
              value={form.specsLines}
              onChange={(e) => setForm((f) => ({ ...f, specsLines: e.target.value }))}
              placeholder={'Артикул: XYZ-100\nКолір: чорний'}
            />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Відео YouTube (кожен рядок: Назва | ID ролика)</span>
            <textarea
              className="auth-field__input admin-textarea"
              rows={3}
              value={form.videosLines}
              onChange={(e) => setForm((f) => ({ ...f, videosLines: e.target.value }))}
              placeholder={'Огляд | sy04A4SxTY0'}
            />
          </label>
          <label className="admin-field admin-field--wide">
            <span>
              Відгуки (кожен рядок: автор | оцінка 1–5 | дата YYYY-MM-DD | текст)
            </span>
            <textarea
              className="auth-field__input admin-textarea"
              rows={4}
              value={form.reviewsLines}
              onChange={(e) => setForm((f) => ({ ...f, reviewsLines: e.target.value }))}
              placeholder={'Олег | 5 | 2026-03-01 | Все супер'}
            />
          </label>
          {formError ? (
            <p className="auth-form__error admin-field--wide" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="admin-product-form__actions">
            <button type="submit" className="admin-btn-primary">
              {editingCodeId
                ? 'Зберегти повну копію'
                : editingId
                  ? 'Зберегти зміни'
                  : 'Додати товар'}
            </button>
            {editingId || editingCodeId ? (
              <button type="button" className="admin-btn-ghost" onClick={cancelEdit}>
                Скасувати
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {customList.length > 0 ? (
        <section className="admin-panel admin-panel--flush">
          <h2 className="admin-panel__heading admin-panel__heading--row">
            <span>Ваші товари</span>
            <span className="admin-count-pill">{customList.length}</span>
          </h2>
          <div className="admin-custom-grid">
            {customList.map((p) => {
              const o = prefs.overrides[p.id]
              const dispPrice = o?.priceUah ?? p.priceUah
              const dispOld = o?.oldPriceUah !== undefined ? o.oldPriceUah : p.oldPriceUah
              return (
                <article
                  key={p.id}
                  className={`admin-custom-card${hiddenSet.has(p.id) ? ' admin-custom-card--hidden' : ''}`}
                >
                  <div className="admin-custom-card__visual">
                    <img src={p.image} alt="" loading="lazy" />
                    <label className="admin-custom-card__hide">
                      <input
                        type="checkbox"
                        checked={hiddenSet.has(p.id)}
                        onChange={() => toggleHidden(p.id)}
                      />
                      <span>Приховати</span>
                    </label>
                  </div>
                  <div className="admin-custom-card__body">
                    <p className="admin-custom-card__id">
                      <code className="admin-code">{p.id}</code>
                    </p>
                    <h3 className="admin-custom-card__name">{p.name}</h3>
                    <p className="admin-custom-card__price">
                      {dispPrice.toLocaleString('uk-UA')} ₴
                      {dispOld != null ? (
                        <span className="admin-custom-card__old">
                          {' '}
                          {dispOld.toLocaleString('uk-UA')} ₴
                        </span>
                      ) : null}
                    </p>
                    <div className="admin-product-discount-tools admin-product-discount-tools--card">
                      <div className="admin-product-discount-tools__row">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          className="auth-field__input admin-product-discount-tools__pct"
                          placeholder="%"
                          aria-label={`Знижка % для ${p.name}`}
                          value={discountPctDraft[p.id] ?? ''}
                          onChange={(e) =>
                            setDiscountPctDraft((d) => ({ ...d, [p.id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          className="admin-btn-primary admin-btn-ghost--sm"
                          onClick={() => applyPercentDiscount(p, p.id, dispPrice)}
                        >
                          Знижка
                        </button>
                      </div>
                      {dispOld != null ? (
                        <button
                          type="button"
                          className="admin-btn-ghost admin-btn-ghost--sm"
                          onClick={() => clearProductDiscount(p, p.id, dispOld)}
                        >
                          Без знижки
                        </button>
                      ) : null}
                    </div>
                    <div className="admin-custom-card__actions">
                      <Link to={`/product/${p.id}`} className="admin-btn-ghost admin-btn-ghost--sm">
                        На сайті
                      </Link>
                      <button
                        type="button"
                        className="admin-btn-ghost admin-btn-ghost--sm"
                        onClick={() => startEdit(p)}
                      >
                        Редагувати
                      </button>
                      <button
                        type="button"
                        className="admin-btn-danger admin-btn-ghost--sm"
                        onClick={() => handleDeleteCustom(p)}
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="admin-panel">
        <h2 className="admin-panel__heading">Базовий каталог (з коду)</h2>
        <p className="admin-panel__note admin-panel__note--tight">
          «Усі поля» відкриває форму зверху: можна змінити все, що бачить покупець на сторінці товару.
          Повна копія зберігається окремо від коду. «До коду» — видалити копію й швидкі зміни. Колонка
          «Знижка %»: від поточної ціни в полі рахується акційна ціна; стара ціна підставляється
          автоматично для перекреслення на вітрині.
        </p>
        <div className="admin-table-wrap admin-table-wrap--rounded">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Приховати</th>
                <th>ID</th>
                <th>Назва (швидко)</th>
                <th>Ціна, ₴</th>
                <th>Стара ціна</th>
                <th>Знижка %</th>
                <th className="admin-table__actions-col">Дії</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const rowBase = baseForCodeRow(p)
                const o = prefs.overrides[p.id]
                const name = o?.name ?? rowBase.name
                const price = o?.priceUah ?? rowBase.priceUah
                const oldPrice =
                  o?.oldPriceUah !== undefined ? o.oldPriceUah : rowBase.oldPriceUah
                const hasFull = Boolean(codeEdits[p.id])
                return (
                  <tr key={p.id} style={{ opacity: hiddenSet.has(p.id) ? 0.55 : 1 }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={hiddenSet.has(p.id)}
                        onChange={() => toggleHidden(p.id)}
                        aria-label={`Приховати ${p.id}`}
                      />
                    </td>
                    <td>
                      <code className="admin-code">{p.id}</code>
                      {hasFull ? (
                        <span className="admin-badge-edit" title="Є повна копія в localStorage">
                          повна копія
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <input
                        className="auth-field__input"
                        value={name}
                        onChange={(e) => updateField(rowBase, 'name', e.target.value)}
                        style={{ width: '100%', minWidth: '220px', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className="auth-field__input"
                        value={price}
                        onChange={(e) => updateField(rowBase, 'priceUah', e.target.value)}
                        style={{ width: '7rem', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className="auth-field__input"
                        placeholder="—"
                        value={oldPrice === null ? '' : oldPrice}
                        onChange={(e) => updateField(rowBase, 'oldPriceUah', e.target.value)}
                        style={{ width: '7rem', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td>
                      <div className="admin-product-discount-tools">
                        <div className="admin-product-discount-tools__row">
                          <input
                            type="number"
                            min={1}
                            max={99}
                            className="auth-field__input admin-product-discount-tools__pct"
                            placeholder="%"
                            aria-label={`Знижка % для ${rowBase.name}`}
                            value={discountPctDraft[p.id] ?? ''}
                            onChange={(e) =>
                              setDiscountPctDraft((d) => ({ ...d, [p.id]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className="admin-btn-primary admin-btn-primary--sm"
                            onClick={() => applyPercentDiscount(rowBase, p.id, price)}
                          >
                            OK
                          </button>
                        </div>
                        {oldPrice != null ? (
                          <button
                            type="button"
                            className="admin-btn-ghost admin-btn-ghost--sm"
                            onClick={() => clearProductDiscount(rowBase, p.id, oldPrice)}
                          >
                            Без знижки
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-btn-primary admin-btn-primary--sm"
                          onClick={() => startFullEditCode(p.id)}
                        >
                          Усі поля
                        </button>
                        <button
                          type="button"
                          className="admin-btn-ghost admin-btn-ghost--sm"
                          onClick={() => resetQuickOverrides(p.id)}
                        >
                          Швидко скинути
                        </button>
                        {hasFull ? (
                          <button
                            type="button"
                            className="admin-btn-danger admin-btn-ghost--sm"
                            onClick={() => revertCodeProductToRepo(p.id)}
                          >
                            До коду
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
