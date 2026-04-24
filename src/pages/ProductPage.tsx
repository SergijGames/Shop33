/**
 * Shop31 — сторінка товару: галерея, ціна, кошик/обране, вкладки, відгуки.
 * Зв’язки: catalog, ShopContext, productReviewsStorage, i18n, formatMoney
 */
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { StarRating } from '../components/StarRating'
import { useAuth } from '../context/AuthContext'
import { useShop } from '../context/ShopContext'
import { getShopProductById } from '../data/catalog'
import { getCategoryDisplayLabel } from '../data/catalogDisplay'
import { useI18n } from '../i18n/I18nContext'
import { appendProductReview } from '../shop/productReviewsStorage'
import { formatUahAmount } from '../utils/formatMoney'

type TabId = 'about' | 'video' | 'specs' | 'reviews'

export function ProductPage() {
  const { locale, t } = useI18n()
  const { productId = '' } = useParams<{ productId: string }>()
  const { user } = useAuth()
  const [reviewTick, setReviewTick] = useState(0)
  const product = useMemo(
    () => getShopProductById(productId),
    [productId, reviewTick],
  )
  const { addToCart, isFavorite, toggleFavorite } = useShop()
  const [mainIdx, setMainIdx] = useState(0)
  const [tab, setTab] = useState<TabId>('about')
  const [cartHint, setCartHint] = useState(false)
  const [reviewAuthor, setReviewAuthor] = useState(() => user?.name ?? '')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewOk, setReviewOk] = useState(false)

  useEffect(() => {
    if (user?.name) {
      setReviewAuthor((prev) => (prev.trim() === '' ? user.name : prev))
    }
  }, [user?.name])

  if (!product) {
    return <Navigate to="/" replace />
  }

  const p = product
  const dateLocale = locale === 'en' ? 'en-US' : 'uk-UA'

  const catLabel = getCategoryDisplayLabel(p.categoryId, locale)

  const tabs: { id: TabId; label: string }[] = [
    { id: 'about', label: t('product.tabAbout') },
    { id: 'video', label: t('product.tabVideo') },
    { id: 'specs', label: t('product.tabSpecs') },
    { id: 'reviews', label: t('product.tabReviews') },
  ]

  const avgRating =
    p.reviews.length > 0
      ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
      : 0

  const fav = isFavorite(p.id)

  function handleReviewSubmit(e: FormEvent) {
    e.preventDefault()
    setReviewError(null)
    setReviewOk(false)
    const result = appendProductReview(p.id, {
      author: reviewAuthor,
      rating: reviewRating,
      text: reviewText,
    })
    if (!result.ok) {
      setReviewError(result.message)
      return
    }
    setReviewText('')
    setReviewOk(true)
    setReviewTick((n) => n + 1)
    window.setTimeout(() => setReviewOk(false), 4000)
  }

  function handleBuy() {
    addToCart(p.id, 1)
    setCartHint(true)
    window.setTimeout(() => setCartHint(false), 3200)
  }

  return (
    <main className="product-page">
      <div className="container product-page__inner">
        <nav className="product-page__crumb" aria-label={t('product.crumbAria')}>
          <Link to="/">{t('nav.home')}</Link>
          <span className="product-page__crumb-sep">/</span>
          <Link to="/catalog">{t('nav.catalog')}</Link>
          <span className="product-page__crumb-sep">/</span>
          <span className="product-page__crumb-current">{p.name}</span>
        </nav>

        <div className="product-page__layout">
          <div className="product-page__gallery-block">
            <div className="product-page__main-photo">
              <img
                src={p.gallery[mainIdx] ?? p.image}
                alt=""
                width={800}
                height={800}
              />
              <span className="product-page__tag">{p.tag}</span>
            </div>
            <div className="product-page__thumbs" role="list">
              {p.gallery.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className={`product-page__thumb${i === mainIdx ? ' product-page__thumb--active' : ''}`}
                  onClick={() => setMainIdx(i)}
                  aria-label={t('product.photo', { n: i + 1 })}
                  aria-current={i === mainIdx ? 'true' : undefined}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          <div className="product-page__buy-block">
            <p className="product-page__category">{catLabel}</p>
            <h1 className="product-page__title">{p.name}</h1>
            {p.spec ? (
              <p className="product-page__subtitle">{p.spec}</p>
            ) : null}

            {p.reviews.length > 0 ? (
              <div className="product-page__rating-row">
                <StarRating value={avgRating} />
                <span className="product-page__rating-num">
                  {avgRating.toFixed(1)} · {p.reviews.length}{' '}
                  {p.reviews.length === 1 ? t('product.rev1') : t('product.revN')}
                </span>
              </div>
            ) : (
              <p className="product-page__rating-num product-page__rating-num--muted">
                {t('product.noRevYet')}
              </p>
            )}

            <div className="product-page__prices">
              <span className="product-page__price">
                <span className="product-page__amount">
                  {formatUahAmount(p.priceUah)}
                </span>
                <span className="product-page__currency">₴</span>
              </span>
              {p.oldPriceUah != null ? (
                <span className="product-page__old">
                  {formatUahAmount(p.oldPriceUah)} ₴
                </span>
              ) : null}
            </div>

            <div className="product-page__actions">
              <button type="button" className="product-page__buy" onClick={handleBuy}>
                {t('product.buy')}
              </button>
              <button
                type="button"
                className={`product-page__fav${fav ? ' product-page__fav--on' : ''}`}
                onClick={() => toggleFavorite(p.id)}
                aria-pressed={fav}
              >
                {fav ? t('product.favOn') : t('product.favOff')}
              </button>
            </div>
            {cartHint ? (
              <p className="product-page__cart-hint" role="status">
                {t('product.cartHint')}{' '}
                <Link to="/cart">{t('product.toCart')}</Link>
              </p>
            ) : null}
          </div>
        </div>

        <div className="product-page__tabs-wrap">
          <div className="product-page__tabs" role="tablist" aria-label={t('product.tabsAria')}>
            {tabs.map((tabItem) => (
              <button
                key={tabItem.id}
                type="button"
                role="tab"
                aria-selected={tab === tabItem.id}
                className={`product-page__tab${tab === tabItem.id ? ' product-page__tab--active' : ''}`}
                onClick={() => setTab(tabItem.id)}
              >
                {tabItem.label}
              </button>
            ))}
          </div>

          <div className="product-page__panel" role="tabpanel">
            {tab === 'about' && (
              <div className="product-page__about">
                <h2 className="product-page__panel-title">{t('product.aboutTitle')}</h2>
                <p className="product-page__desc">{p.description}</p>
              </div>
            )}

            {tab === 'video' && (
              <div className="product-page__videos">
                <h2 className="product-page__panel-title">{t('product.videoTitle')}</h2>
                {p.videos.length === 0 ? (
                  <p className="product-page__video-empty">{t('product.videoEmpty')}</p>
                ) : (
                  <div className="product-page__video-grid">
                    {p.videos.map((v) => (
                      <figure key={v.youtubeId + v.title} className="product-page__video-card">
                        <div className="product-page__video-frame">
                          <iframe
                            title={v.title}
                            src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                          />
                        </div>
                        <figcaption>{v.title}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'specs' && (
              <div className="product-page__specs">
                <h2 className="product-page__panel-title">{t('product.specsTitle')}</h2>
                <table className="product-page__table">
                  <tbody>
                    {p.specsTable.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'reviews' && (
              <div className="product-page__reviews">
                <h2 className="product-page__panel-title">{t('product.revTitle')}</h2>
                {p.reviews.length === 0 ? (
                  <p className="product-page__review-empty">{t('product.revEmpty')}</p>
                ) : (
                  <ul className="product-page__review-list">
                    {p.reviews.map((r, i) => (
                      <li
                        key={`${r.author}-${r.date}-${i}`}
                        className="product-page__review"
                      >
                        <div className="product-page__review-head">
                          <strong>{r.author}</strong>
                          <StarRating value={r.rating} />
                          <time dateTime={r.date}>
                            {new Date(r.date).toLocaleDateString(dateLocale, {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </time>
                        </div>
                        <p>{r.text}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="product-page__review-form-wrap">
                  <h3 className="product-page__review-form-title">{t('product.revFormTitle')}</h3>
                  <form className="product-page__review-form" onSubmit={handleReviewSubmit}>
                    <label className="product-page__review-field">
                      <span>{t('product.revName')}</span>
                      <input
                        className="auth-field__input"
                        value={reviewAuthor}
                        onChange={(e) => setReviewAuthor(e.target.value)}
                        maxLength={120}
                        autoComplete="nickname"
                        placeholder={t('product.revNamePh')}
                      />
                    </label>
                    <div className="product-page__review-field">
                      <span id="review-rating-label">{t('product.revRating')}</span>
                      <div
                        className="product-page__review-stars-pick"
                        role="group"
                        aria-labelledby="review-rating-label"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`product-page__review-star-btn${n <= reviewRating ? ' is-on' : ''}`}
                            onClick={() => setReviewRating(n)}
                            aria-pressed={n <= reviewRating}
                            aria-label={t('product.revStar', { n })}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="product-page__review-field">
                      <span>{t('product.revText')}</span>
                      <textarea
                        className="product-page__review-textarea"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={4}
                        maxLength={4000}
                        placeholder={t('product.revTextPh')}
                      />
                    </label>
                    {reviewError ? (
                      <p className="auth-form__error" role="alert">
                        {reviewError}
                      </p>
                    ) : null}
                    {reviewOk ? (
                      <p className="product-page__review-saved" role="status">
                        {t('product.revThanks')}
                      </p>
                    ) : null}
                    <button type="submit" className="product-page__review-submit">
                      {t('product.revSubmit')}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
