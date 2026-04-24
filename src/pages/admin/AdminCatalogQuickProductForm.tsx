/**
 * Shop31 — адмін: швидка форма додавання товару в каталог (кастомний product).
 * Зв’язки: adminCustomProductsStorage, data/products (структура)
 */
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../data/products'
import { shopCategories, type ShopCategoryId } from '../../data/shopCategories'
import {
  createCustomProductId,
  defaultCustomProductImage,
  upsertCustomProduct,
} from '../../shop/adminCustomProductsStorage'

function parseVideosLines(text: string): Product['videos'] {
  const out: Product['videos'] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const i = line.indexOf('|')
    if (i === -1) continue
    const title = line.slice(0, i).trim()
    const youtubeId = line.slice(i + 1).trim()
    if (!title || !youtubeId) continue
    out.push({ title: title.slice(0, 200), youtubeId: youtubeId.slice(0, 32) })
  }
  return out
}

function buildQuickProduct(values: {
  name: string
  spec: string
  tag: string
  categoryId: ShopCategoryId
  priceUah: number
  oldPriceUah: number | null
  image: string
  description: string
  videosLines: string
}): Product {
  const id = createCustomProductId()
  const image = values.image.trim() || defaultCustomProductImage
  return {
    id,
    name: values.name.trim().slice(0, 500),
    spec: values.spec.trim() ? values.spec.trim().slice(0, 300) : undefined,
    priceUah: values.priceUah,
    oldPriceUah: values.oldPriceUah,
    tag: values.tag.trim().slice(0, 40) || 'Новинка',
    image,
    categoryId: values.categoryId,
    description:
      values.description.trim().slice(0, 8000) ||
      'Опис можна розширити в розділі «Товари».',
    gallery: [image],
    videos: parseVideosLines(values.videosLines),
    specsTable: [],
    reviews: [],
  }
}

export function AdminCatalogQuickProductForm() {
  const [name, setName] = useState('')
  const [spec, setSpec] = useState('')
  const [tag, setTag] = useState('Новинка')
  const [categoryId, setCategoryId] = useState<ShopCategoryId>('gadzhety')
  const [priceUah, setPriceUah] = useState('')
  const [oldPriceUah, setOldPriceUah] = useState('')
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const [videosLines, setVideosLines] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(false)
    const n = name.trim()
    if (n.length < 2) {
      setError('Вкажіть назву товару (мінімум 2 символи).')
      return
    }
    const price = Math.round(Number(priceUah))
    if (!Number.isFinite(price) || price < 0) {
      setError('Вкажіть коректну ціну.')
      return
    }
    let oldP: number | null = null
    if (oldPriceUah.trim() !== '') {
      const o = Math.round(Number(oldPriceUah))
      if (!Number.isFinite(o) || o < 0) {
        setError('Стара ціна має бути числом або порожньою.')
        return
      }
      oldP = o
    }
    const product = buildQuickProduct({
      name: n,
      spec,
      tag,
      categoryId,
      priceUah: price,
      oldPriceUah: oldP,
      image,
      description,
      videosLines,
    })
    try {
      upsertCustomProduct(product)
    } catch {
      setError('Не вдалося зберегти (localStorage).')
      return
    }
    setLastCreatedId(product.id)
    setName('')
    setSpec('')
    setTag('Новинка')
    setCategoryId('gadzhety')
    setPriceUah('')
    setOldPriceUah('')
    setImage('')
    setDescription('')
    setVideosLines('')
    setOk(true)
    window.setTimeout(() => setOk(false), 3500)
  }

  return (
    <section className="admin-glass admin-product-form" style={{ marginBottom: '24px' }}>
      <div className="admin-glass__head">
        <h2 className="admin-glass__title">Створити товар у каталозі</h2>
        <span className="admin-chip admin-chip--pulse">Швидко</span>
      </div>
      <p className="admin-panel__note admin-panel__note--tight">
        Товар одразу з’явиться в каталозі, пошуку та на головній (як «ваш» custom-товар). Повне
        редагування — у розділі{' '}
        <Link to="/admin/products" style={{ color: 'var(--neon-magenta)', fontWeight: 600 }}>
          Товари
        </Link>
        .
      </p>
      <form className="admin-product-form__grid" onSubmit={handleSubmit}>
        <label className="admin-field admin-field--wide">
          <span>Назва *</span>
          <input
            className="auth-field__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Наприклад, Зарядна станція 20000 мА·год"
          />
        </label>
        <label className="admin-field">
          <span>Ціна, ₴ *</span>
          <input
            type="number"
            min={0}
            className="auth-field__input"
            value={priceUah}
            onChange={(e) => setPriceUah(e.target.value)}
            required
          />
        </label>
        <label className="admin-field">
          <span>Стара ціна</span>
          <input
            type="number"
            min={0}
            className="auth-field__input"
            value={oldPriceUah}
            onChange={(e) => setOldPriceUah(e.target.value)}
            placeholder="—"
          />
        </label>
        <label className="admin-field">
          <span>Категорія</span>
          <select
            className="auth-field__input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value as ShopCategoryId)}
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
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Новинка"
          />
        </label>
        <label className="admin-field admin-field--wide">
          <span>Підзаголовок (spec)</span>
          <input
            className="auth-field__input"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            placeholder="20000 мА·год · USB-C"
          />
        </label>
        <label className="admin-field admin-field--wide">
          <span>URL фото</span>
          <input
            className="auth-field__input"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder={defaultCustomProductImage}
          />
        </label>
        <label className="admin-field admin-field--wide">
          <span>Короткий опис</span>
          <textarea
            className="auth-field__input admin-textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Необов’язково; можна доповнити пізніше в «Товари»"
          />
        </label>
        <label className="admin-field admin-field--wide">
          <span>Відео YouTube (кожен рядок: Назва | ID ролика)</span>
          <textarea
            className="auth-field__input admin-textarea"
            rows={3}
            value={videosLines}
            onChange={(e) => setVideosLines(e.target.value)}
            placeholder={'Огляд | sy04A4SxTY0'}
          />
        </label>
        {error ? (
          <p className="auth-form__error admin-field--wide" role="alert">
            {error}
          </p>
        ) : null}
        {ok && lastCreatedId ? (
          <p className="product-page__review-saved admin-field--wide" role="status">
            Товар додано.{' '}
            <Link to="/catalog">Каталог</Link>
            {' · '}
            <Link to={`/product/${lastCreatedId}`}>Сторінка товару</Link>
            {' · '}
            <Link to="/admin/products">Редагувати далі</Link>
          </p>
        ) : null}
        <div className="admin-product-form__actions">
          <button type="submit" className="admin-btn-primary">
            Додати товар
          </button>
        </div>
      </form>
    </section>
  )
}
