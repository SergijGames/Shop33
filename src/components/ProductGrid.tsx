/**
 * Shop31 — сітка карток товарів (ціна, зірки, кошик, обране).
 * Використовується на головній, у каталозі та пошуку.
 * Зв’язки: ShopContext, catalog/products, StarRating, formatMoney, i18n
 */
import { Link } from 'react-router-dom'
import { StarRating } from './StarRating'
import { useShop } from '../context/ShopContext'
import { useI18n } from '../i18n/I18nContext'
import type { Product } from '../data/products'
import { formatUahAmount } from '../utils/formatMoney'

type Props = {
  products: Product[]
}

export function ProductGrid({ products: items }: Props) {
  const { isFavorite, toggleFavorite, addToCart } = useShop()
  const { t } = useI18n()

  return (
    <div className="product-grid">
      {items.map((p) => {
        const fav = isFavorite(p.id)
        const avgRating =
          p.reviews.length > 0
            ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
            : 0
        return (
          <article key={p.id} className="product-card">
            <div className="product-card__top">
              <Link to={`/product/${p.id}`} className="product-card__link">
                <div className="product-card__visual">
                  <span className="product-card__tag">{p.tag}</span>
                  <div className="product-card__img-wrap">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="product-card__img"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                <div className="product-card__text">
                  <h3 className="product-card__name">{p.name}</h3>
                  {p.spec ? <p className="product-card__spec">{p.spec}</p> : null}
                  {p.reviews.length > 0 ? (
                    <div className="product-card__rating">
                      <StarRating value={avgRating} className="product-card__stars" />
                      <span className="product-card__rating-meta">
                        {avgRating.toFixed(1)} · {p.reviews.length}{' '}
                        {p.reviews.length === 1 ? t('grid.rev1') : t('grid.revN')}
                      </span>
                    </div>
                  ) : (
                    <p className="product-card__no-reviews">{t('grid.noRev')}</p>
                  )}
                </div>
                <div className="product-card__prices">
                  <span className="product-card__price">
                    <span className="product-card__amount">
                      {formatUahAmount(p.priceUah)}
                    </span>
                    <span className="product-card__currency">₴</span>
                  </span>
                  {p.oldPriceUah != null ? (
                    <span className="product-card__old">
                      <span className="product-card__old-amount">
                        {formatUahAmount(p.oldPriceUah)}
                      </span>
                      <span className="product-card__old-currency">₴</span>
                    </span>
                  ) : null}
                </div>
              </Link>
              <button
                type="button"
                className={`product-card__fav-btn${fav ? ' product-card__fav-btn--on' : ''}`}
                aria-label={fav ? t('grid.favRemove') : t('grid.favAdd')}
                aria-pressed={fav}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleFavorite(p.id)
                }}
              >
                <span aria-hidden="true">{fav ? '♥' : '♡'}</span>
              </button>
            </div>
            <button
              type="button"
              className="product-card__buy"
              onClick={() => addToCart(p.id, 1)}
            >
              {t('grid.buy')}
            </button>
          </article>
        )
      })}
    </div>
  )
}
