/**
 * Shop31 — результати пошуку за query; пресети та підказки з адмінки.
 * Зв’язки: searchProducts, adminSearch*Storage, ProductGrid, i18n
 */
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductGrid } from '../components/ProductGrid'
import { getShopProducts } from '../data/catalog'
import { useI18n } from '../i18n/I18nContext'
import { loadSearchPresets } from '../shop/adminSearchPresetsStorage'
import { loadSearchUiPrefs } from '../shop/adminSearchUiStorage'
import { filterProductsByQuery } from '../utils/searchProducts'

export function SearchPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const qRaw = searchParams.get('q') ?? ''
  const q = qRaw.trim()

  const results = useMemo(
    () => filterProductsByQuery(getShopProducts(), q),
    [q],
  )

  const customHint = loadSearchUiPrefs().hintText?.trim()
  const hintParagraph = customHint || t('search.hintDefault')
  const searchPresets = loadSearchPresets()

  const itemsWord = results.length === 1 ? t('search.itemOne') : t('search.itemMany')

  return (
    <main className="search-page">
      <div className="container search-page__inner">
        <h1 className="search-page__title">{t('search.title')}</h1>

        {searchPresets.length > 0 ? (
          <div className="search-page__presets" role="navigation" aria-label={t('search.presetsAria')}>
            <span className="search-page__presets-label">{t('search.presetsLabel')}</span>
            <div className="search-page__presets-chips">
              {searchPresets.map((p) => (
                <Link
                  key={p.id}
                  to={`/search?q=${encodeURIComponent(p.query)}`}
                  className="search-page__preset-chip"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {!q ? (
          <p className="search-page__hint">{hintParagraph}</p>
        ) : (
          <>
            <p className="search-page__meta">
              {t('search.meta', { q, n: results.length, items: itemsWord })}
            </p>
            {results.length === 0 ? (
              <p className="search-page__empty">
                {t('search.emptyBefore')}{' '}
                <Link to="/catalog">{t('search.catalogLink')}</Link>
                {t('search.emptyAfter')}
              </p>
            ) : (
              <ProductGrid products={results} />
            )}
          </>
        )}
      </div>
    </main>
  )
}
