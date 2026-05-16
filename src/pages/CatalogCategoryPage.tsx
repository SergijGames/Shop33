/**
 * Shop31 — товари однієї категорії або користувацької підбірки (?cat=...).
 * Зв’язки: catalog, shopCategories, ProductGrid, i18n
 */
import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ProductGrid } from '../components/ProductGrid'
import { getShopProducts } from '../data/catalog'
import {
  getCatalogAllCardText,
  getCatalogCategoryCards,
  getCategoryDisplayLabel,
} from '../data/catalogDisplay'
import { useI18n } from '../i18n/I18nContext'
import {
  findUserCatalog,
  loadUserCatalogs,
  productsForUserCatalog,
  type UserCatalog,
} from '../shop/adminUserCatalogsStorage'
import { parseCategoryRouteId } from '../data/shopCategories'

type Mode =
  | { kind: 'all' }
  | { kind: 'category'; id: string }
  | { kind: 'collection'; catalog: UserCatalog }
  | 'invalid'

export function CatalogCategoryPage() {
  const { categoryId = '' } = useParams<{ categoryId: string }>()
  const { locale, t } = useI18n()

  const mode: Mode = useMemo(() => {
    if (categoryId === 'all') return { kind: 'all' }
    const cat = parseCategoryRouteId(categoryId)
    if (cat) return { kind: 'category', id: cat }
    const coll = findUserCatalog(categoryId)
    if (coll) return { kind: 'collection', catalog: coll }
    return 'invalid'
  }, [categoryId])

  if (mode === 'invalid') {
    return <Navigate to="/catalog" replace />
  }

  const shopProducts = getShopProducts()
  const userCatalogs = loadUserCatalogs()

  const filtered =
    mode.kind === 'all'
      ? shopProducts
      : mode.kind === 'category'
        ? shopProducts.filter((p) => p.categoryId === mode.id)
        : productsForUserCatalog(mode.catalog, shopProducts)

  const allCard = getCatalogAllCardText(locale)
  const categoryCards = getCatalogCategoryCards(locale)
  const title =
    mode.kind === 'all'
      ? allCard.label
      : mode.kind === 'category'
        ? getCategoryDisplayLabel(mode.id, locale)
        : mode.catalog.title

  return (
    <main className="catalog-page catalog-page--products">
      <div className="container catalog-products-page">
        <nav className="catalog-products-page__crumb" aria-label={t('crumb.nav')}>
          <Link to="/catalog">{t('catPage.crumb')}</Link>
          <span className="catalog-products-page__crumb-sep" aria-hidden="true">
            /
          </span>
          <span className="catalog-products-page__crumb-current">{title}</span>
        </nav>

        <div
          className="catalog-category-strip"
          role="navigation"
          aria-label={t('catPage.chipsAria')}
        >
          <Link
            to="/catalog/all"
            className={`catalog-category-chip${mode.kind === 'all' ? ' catalog-category-chip--active' : ''}`}
          >
            {allCard.label}
          </Link>
          {categoryCards.map((c) => (
            <Link
              key={c.id}
              to={`/catalog/${c.id}`}
              className={`catalog-category-chip${mode.kind === 'category' && mode.id === c.id ? ' catalog-category-chip--active' : ''}`}
            >
              {c.label}
            </Link>
          ))}
          {userCatalogs.map((c) => (
            <Link
              key={c.id}
              to={`/catalog/${c.id}`}
              className={`catalog-category-chip catalog-category-chip--user${mode.kind === 'collection' && mode.catalog.id === c.id ? ' catalog-category-chip--active' : ''}`}
            >
              {c.title}
            </Link>
          ))}
        </div>

        <div className="catalog-products-page__head">
          <h1 className="catalog-products-page__title">{title}</h1>
          <Link to="/catalog" className="catalog-products__reset">
            {t('catPage.back')}
          </Link>
        </div>

        {mode.kind === 'collection' && mode.catalog.description ? (
          <p className="catalog-products-page__collection-desc">{mode.catalog.description}</p>
        ) : null}

        {filtered.length === 0 ? (
          <p className="catalog-products__empty">
            {t('catPage.emptyStart')}{' '}
            <Link to="/catalog/all">{t('catPage.allProducts')}</Link> {t('catPage.emptyOr')}{' '}
            <Link to="/catalog">{t('catPage.otherCats')}</Link>.
          </p>
        ) : (
          <ProductGrid products={filtered} />
        )}
      </div>
    </main>
  )
}
