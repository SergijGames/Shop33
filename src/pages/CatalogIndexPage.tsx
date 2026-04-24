/**
 * Shop31 — індекс каталогу: сітка категорій і колекцій користувача.
 * Зв’язки: catalogDisplay, adminUserCatalogsStorage, ProductGrid
 */
import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getShopProducts } from '../data/catalog'
import {
  getCatalogAllCardText,
  getCatalogCategoryCards,
  getCatalogHero,
} from '../data/catalogDisplay'
import { useI18n } from '../i18n/I18nContext'
import { loadUserCatalogs, visibleCountInUserCatalog } from '../shop/adminUserCatalogsStorage'

export function CatalogIndexPage() {
  const { locale, t } = useI18n()

  const itemsLabel = useCallback(
    (n: number) => {
      if (n === 0) return t('catalog.count0')
      if (locale === 'en') {
        return n === 1 ? t('catalog.count1', { n }) : t('catalog.countN', { n })
      }
      const last = n % 10
      const last2 = n % 100
      if (last2 >= 11 && last2 <= 14) return t('catalog.countN', { n })
      if (last === 1) return t('catalog.count1', { n })
      if (last >= 2 && last <= 4) return t('catalog.count2', { n })
      return t('catalog.countN', { n })
    },
    [locale, t],
  )

  const hero = getCatalogHero(locale)
  const allCard = getCatalogAllCardText(locale)
  const categoryCards = getCatalogCategoryCards(locale)
  const shopProducts = getShopProducts()
  const countByCategory = new Map<string, number>()
  for (const p of shopProducts) {
    countByCategory.set(p.categoryId, (countByCategory.get(p.categoryId) ?? 0) + 1)
  }
  const totalCount = shopProducts.length
  const userCatalogs = loadUserCatalogs()

  return (
    <main className="catalog-page">
      <div className="catalog-page__hero container">
        <h1 className="catalog-page__title">{hero.title}</h1>
        <p className="catalog-page__lead">{hero.lead}</p>
        {hero.creditCustom ? (
          <p className="catalog-page__credit">{hero.creditCustom}</p>
        ) : (
          <p className="catalog-page__credit">
            {t('catalog.photo')}{' '}
            <a href="https://unsplash.com" target="_blank" rel="noreferrer">
              Unsplash
            </a>
          </p>
        )}
      </div>

      <div className="container catalog-grid">
        <Link
          to="/catalog/all"
          className="catalog-card catalog-card--all catalog-card--cyan"
        >
          <div className="catalog-card__media">
            <span className="catalog-card__all-icon" aria-hidden="true">
              ALL
            </span>
            <div className="catalog-card__overlay" aria-hidden="true" />
          </div>
          <div className="catalog-card__body">
            <h2 className="catalog-card__label">{allCard.label}</h2>
            <p className="catalog-card__desc">{allCard.desc}</p>
            <p className="catalog-card__count">{itemsLabel(totalCount)}</p>
          </div>
        </Link>

        {categoryCards.map((card) => (
          <Link
            key={card.id}
            to={`/catalog/${card.id}`}
            className={`catalog-card catalog-card--${card.glow}`}
          >
            <div className="catalog-card__media">
              <img
                src={card.image}
                alt={card.alt}
                width={900}
                height={675}
                loading="lazy"
                decoding="async"
              />
              <div className="catalog-card__overlay" aria-hidden="true" />
            </div>
            <div className="catalog-card__body">
              <h2 className="catalog-card__label">{card.label}</h2>
              <p className="catalog-card__desc">{card.description}</p>
              <p
                className={`catalog-card__count${countByCategory.get(card.id) ? '' : ' catalog-card__count--empty'}`}
              >
                {itemsLabel(countByCategory.get(card.id) ?? 0)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {userCatalogs.length > 0 ? (
        <>
          <div className="container catalog-user-section">
            <h2 className="catalog-user-section__title">{t('catalog.userTitle')}</h2>
            <p className="catalog-user-section__lead">{t('catalog.userLead')}</p>
          </div>
          <div className="container catalog-grid catalog-grid--user">
            {userCatalogs.map((c) => {
              const n = visibleCountInUserCatalog(c, shopProducts)
              return (
                <Link
                  key={c.id}
                  to={`/catalog/${c.id}`}
                  className={`catalog-card catalog-card--${c.glow}`}
                >
                  <div className="catalog-card__media">
                    <img
                      src={c.image}
                      alt={c.alt}
                      width={900}
                      height={675}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="catalog-card__overlay" aria-hidden="true" />
                  </div>
                  <div className="catalog-card__body">
                    <h2 className="catalog-card__label">{c.title}</h2>
                    <p className="catalog-card__desc">
                      {c.description || t('catalog.collectionFallback')}
                    </p>
                    <p
                      className={`catalog-card__count${n ? '' : ' catalog-card__count--empty'}`}
                    >
                      {itemsLabel(n)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      ) : null}
    </main>
  )
}
