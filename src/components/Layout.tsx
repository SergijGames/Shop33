/**
 * Shop31 — каркас сторінок вітрини: шапка, футер, перемикач мови, Outlet.
 * Пошук у шапці (HeaderSearch), навігація, блок профілю.
 * Зв’язки: App.tsx, HeaderSearch.tsx, AuthContext, ShopContext, I18nContext
 */
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useShop } from '../context/ShopContext'
import { useI18n } from '../i18n/I18nContext'
import { HeaderSearch } from './HeaderSearch'
import { userDisplayInitials } from '../utils/userInitials'

function CatalogNavLink() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const catalogHere = pathname === '/catalog' || pathname.startsWith('/catalog/')

  return (
    <NavLink
      to="/catalog"
      className={() =>
        `btn-catalog${catalogHere ? ' btn-catalog--active' : ''}`
      }
    >
      <span className="btn-catalog__burger" aria-hidden="true" />
      {t('nav.catalog')}
    </NavLink>
  )
}

function AdminHeaderLink() {
  const { user } = useAuth()
  const { t } = useI18n()
  if (user?.role !== 'admin') return null
  return (
    <Link
      to="/admin"
      className="icon-link icon-link--admin"
      title={t('nav.adminTitle')}
    >
      <span className="icon-link__glyph" aria-hidden="true">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </span>
      <span className="icon-link__text">{t('nav.admin')}</span>
    </Link>
  )
}

function HeaderShopLinks() {
  const { pathname } = useLocation()
  const { favoriteCount, cartItemCount } = useShop()
  const { t } = useI18n()
  const favHere = pathname === '/favorites'
  const cartHere = pathname === '/cart'

  return (
    <>
      <Link
        to="/favorites"
        className={`icon-link${favHere ? ' icon-link--nav-active' : ''}`}
      >
        <span className="icon-link__glyph" aria-hidden="true">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </span>
        <span className="icon-link__text">{t('nav.favorites')}</span>
        {favoriteCount > 0 ? (
          <span className="icon-link__badge">
            {favoriteCount > 99 ? '99+' : favoriteCount}
          </span>
        ) : null}
      </Link>
      <Link
        to="/cart"
        className={`icon-link icon-link--accent${cartHere ? ' icon-link--nav-active' : ''}`}
      >
        <span className="icon-link__glyph" aria-hidden="true">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </span>
        <span className="icon-link__text">{t('nav.cart')}</span>
        {cartItemCount > 0 ? (
          <span className="icon-link__badge">
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </span>
        ) : null}
      </Link>
    </>
  )
}

function RegistrationFlash() {
  const location = useLocation()
  const navigate = useNavigate()
  const msg = (location.state as { registrationMsg?: string } | null)?.registrationMsg

  useEffect(() => {
    if (!msg) return
    const t = window.setTimeout(() => {
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { replace: true, state: {} },
      )
    }, 9000)
    return () => window.clearTimeout(t)
  }, [msg, location.pathname, location.search, location.hash, navigate])

  if (!msg) return null
  return (
    <div className="flash-notice" role="status">
      <div className="container flash-notice__inner">{msg}</div>
    </div>
  )
}

function HeaderAccount() {
  const { user, logout } = useAuth()
  const { t } = useI18n()

  if (user) {
    const initials = userDisplayInitials(user.name)
    return (
      <div className="header-account">
        <Link
          to="/account"
          className="header-account__profile"
          title={`${user.name} — ${t('account.openProfile')}`}
          aria-label={`${t('account.profileAria')}: ${user.name}`}
        >
          <span className="header-account__avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="header-account__profile-text">
            <span className="header-account__name">{user.name}</span>
            <span className="header-account__hint">{t('account.profileAria')}</span>
          </span>
        </Link>
        <button type="button" className="header-account__logout" onClick={logout}>
          {t('account.logout')}
        </button>
      </div>
    )
  }

  return (
    <div className="header-account header-account--guest">
      <Link
        to="/login"
        className="header-account__profile header-account__profile--guest"
        aria-label={t('account.guestAria')}
      >
        <span className="header-account__avatar header-account__avatar--guest" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        <span className="header-account__profile-text">
          <span className="header-account__name">{t('account.guestTitle')}</span>
          <span className="header-account__hint">{t('account.guestHint')}</span>
        </span>
      </Link>
    </div>
  )
}

export function Layout() {
  const { locale, toggleLocale, t } = useI18n()
  const { pathname, search } = useLocation()

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [pathname, search])

  return (
    <div className="shop">
      <div className="top-bar">
        <div className="container top-bar__inner">
          <span className="top-bar__city">{t('top.city')}</span>
          <span className="top-bar__spacer" />
          <button
            type="button"
            className="top-bar__lang"
            onClick={toggleLocale}
            aria-label={locale === 'uk' ? t('lang.toEn') : t('lang.toUk')}
          >
            {locale === 'uk' ? 'EN' : 'UA'}
          </button>
        </div>
      </div>

      <header className="header">
        <div className="container header__row">
          <Link to="/" className="logo">
            <span className="logo__mark">Shop</span>
            <span className="logo__num">31</span>
          </Link>

          <CatalogNavLink />

          <HeaderSearch />

          <nav className="header__actions" aria-label={t('nav.navLabel')}>
            <AdminHeaderLink />
            <HeaderShopLinks />
            <HeaderAccount />
          </nav>
        </div>
      </header>

      <RegistrationFlash />

      <div className="page-transition" key={pathname + search}>
        <Outlet />
      </div>

      <footer className="footer">
        <div className="container footer__grid">
          <div>
            <Link to="/" className="logo logo--footer">
              <span className="logo__mark">Shop</span>
              <span className="logo__num">31</span>
            </Link>
            <p className="footer__copy">{t('footer.copy')}</p>
          </div>
          <div>
            <h3 className="footer__heading">{t('footer.buyers')}</h3>
            <ul className="footer__list">
              <li>
                <Link to="/catalog">{t('nav.catalog')}</Link>
              </li>
              <li>
                <Link to="/favorites">{t('nav.favorites')}</Link>
              </li>
              <li>
                <Link to="/cart">{t('nav.cart')}</Link>
              </li>
              <li>
                <Link to="/login">{t('footer.login')}</Link>
              </li>
              <li>
                <Link to="/register">{t('footer.register')}</Link>
              </li>
              <li>
                <a href="#">{t('footer.delivery')}</a>
              </li>
              <li>
                <a href="#">{t('footer.warranty')}</a>
              </li>
              <li>
                <a href="#">{t('footer.returns')}</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="footer__heading">{t('footer.contacts')}</h3>
            <ul className="footer__list">
              <li>
                <a href="mailto:hello@shop31.ua">hello@shop31.ua</a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
