/**
 * Shop31 — головна сторінка: hero, хіти продажів, посилання в каталог.
 * Зв’язки: catalog, ProductGrid, catalogDisplay (через дані), i18n
 */
import { Link } from 'react-router-dom'
import { ProductGrid } from '../components/ProductGrid'
import { getShopProducts } from '../data/catalog'
import { useI18n } from '../i18n/I18nContext'

export function HomePage() {
  const { t } = useI18n()
  return (
    <main>
      <section className="hero container" aria-label={t('home.heroAria')}>
        <div className="hero__grid">
          <div className="hero__main">
            <p className="hero__eyebrow">{t('home.eyebrow')}</p>
            <h1 className="hero__title">
              {t('home.title1')}
              <span className="hero__title-glow"> {t('home.title2')}</span>
            </h1>
            <p className="hero__desc">{t('home.desc')}</p>
            <a href="#" className="hero__cta">
              {t('home.cta')}
            </a>
          </div>
          <div className="hero__side">
            <div className="hero-card hero-card--cyan">
              <span className="hero-card__label">{t('home.cardFast')}</span>
              <strong>{t('home.cardFastSub')}</strong>
            </div>
            <div className="hero-card hero-card--magenta">
              <span className="hero-card__label">{t('home.cardPay')}</span>
              <strong>{t('home.cardPaySub')}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="home-catalog-strip container" aria-label={t('nav.catalog')}>
        <div className="home-catalog-strip__inner">
          <p className="home-catalog-strip__text">{t('home.strip')}</p>
          <Link to="/catalog" className="home-catalog-strip__link">
            {t('home.stripLink')}
          </Link>
        </div>
      </section>

      <section className="section container">
        <div className="section__head">
          <h2 className="section__title">{t('home.hits')}</h2>
          <Link to="/catalog" className="section__more">
            {t('home.more')}
          </Link>
        </div>
        <ProductGrid products={getShopProducts()} />
      </section>
    </main>
  )
}
