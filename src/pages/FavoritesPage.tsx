/**
 * Shop31 — обрані товари з кошика контексту; перехід у кошик.
 * Зв’язки: ShopContext, catalog, ProductGrid, i18n
 */
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { getShopProductById } from '../data/catalog'
import { useI18n } from '../i18n/I18nContext'
import type { Product } from '../data/products'
import { formatUahAmount } from '../utils/formatMoney'

export function FavoritesPage() {
  const { t } = useI18n()
  const { favorites, toggleFavorite, addToCart, favoriteCount, pruneStaleFavorites } =
    useShop()

  const items: Product[] = favorites
    .map((id) => getShopProductById(id))
    .filter((p): p is Product => p != null)

  const staleCount = favoriteCount - items.length

  const metaText =
    favoriteCount === 0
      ? t('fav.meta0')
      : items.length === 1
        ? t('fav.meta1')
        : t('fav.metaN', { n: items.length })

  return (
    <main className="favorites-page">
      <div className="container favorites-page__inner">
        <nav className="favorites-page__crumb" aria-label={t('crumb.nav')}>
          <Link to="/">{t('nav.home')}</Link>
          <span className="favorites-page__crumb-sep">/</span>
          <span className="favorites-page__crumb-current">{t('fav.title')}</span>
        </nav>

        <h1 className="favorites-page__title">{t('fav.title')}</h1>
        <p className="favorites-page__meta">{metaText}</p>

        {staleCount > 0 ? (
          <p className="favorites-page__stale">
            {staleCount}{' '}
            {staleCount === 1 ? t('fav.stale1') : t('fav.staleN')}{' '}
            <button type="button" className="favorites-page__stale-btn" onClick={pruneStaleFavorites}>
              {t('fav.prune')}
            </button>
          </p>
        ) : null}

        {items.length === 0 ? (
          <div className="favorites-page__empty">
            <p>{t('fav.empty')}</p>
            <Link to="/catalog" className="favorites-page__cta">
              {t('fav.cta')}
            </Link>
          </div>
        ) : (
          <ul className="favorites-list">
            {items.map((p) => (
              <li key={p.id} className="favorites-line">
                <Link to={`/product/${p.id}`} className="favorites-line__media">
                  <img src={p.image} alt="" width={96} height={96} />
                </Link>
                <div className="favorites-line__info">
                  <Link to={`/product/${p.id}`} className="favorites-line__name">
                    {p.name}
                  </Link>
                  {p.spec ? <p className="favorites-line__spec">{p.spec}</p> : null}
                  <p className="favorites-line__price">
                    {formatUahAmount(p.priceUah)} ₴
                  </p>
                </div>
                <div className="favorites-line__actions">
                  <button type="button" className="favorites-line__cart" onClick={() => addToCart(p.id, 1)}>
                    {t('fav.addCart')}
                  </button>
                  <button
                    type="button"
                    className="favorites-line__unfav"
                    onClick={() => toggleFavorite(p.id)}
                    aria-label={t('fav.unfavAria')}
                  >
                    {t('fav.remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
