/**
 * Shop31 — профіль користувача: бонуси, меню, швидкі посилання.
 * Зв’язки: AuthContext, ShopContext, bonusStorage, useBonusBalance, i18n
 */
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useShop } from '../context/ShopContext'
import {
  IconCart,
  IconGrid,
  IconHeart,
  IconHome,
  IconLogout,
  IconOrders,
  IconPercent,
  IconSearch,
  IconSettings,
  IconShield,
} from '../components/AccountProfileIcons'
import { useBonusBalance } from '../hooks/useBonusBalance'
import { setBonusBalance } from '../shop/bonusStorage'
import { readOrders } from '../shop/ordersStorage'
import { userDisplayInitials } from '../utils/userInitials'
import { maskEmail } from '../utils/maskEmail'
import { formatUahAmount } from '../utils/formatMoney'
import { useI18n } from '../i18n/I18nContext'

function MenuRow({
  to,
  icon,
  label,
  badge,
  accent,
}: {
  to: string
  icon: ReactNode
  label: string
  badge?: number
  accent?: boolean
}) {
  return (
    <Link
      to={to}
      className={`account-menu-row${accent ? ' account-menu-row--accent' : ''}`}
    >
      <span className="account-menu-row__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="account-menu-row__label">{label}</span>
      {badge != null && badge > 0 ? (
        <span className="account-menu-row__badge">{badge > 99 ? '99+' : badge}</span>
      ) : (
        <span className="account-menu-row__spacer" />
      )}
      <span className="account-menu-row__chevron" aria-hidden="true">
        ›
      </span>
    </Link>
  )
}

export function AccountPage() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { favoriteCount, cartItemCount } = useShop()
  const bonusBalance = useBonusBalance(user?.email)
  const [bonusEditValue, setBonusEditValue] = useState('0')
  const [bonusEditErr, setBonusEditErr] = useState<string | null>(null)

  if (!user) {
    return <Navigate to="/login" replace state={{ from: { pathname: '/account' } }} />
  }

  const accountEmail = user.email
  const accountName = user.name
  const isAdmin = user.role === 'admin'
  const initials = userDisplayInitials(accountName)
  const orderCount = readOrders().length

  useEffect(() => {
    setBonusEditValue(String(bonusBalance))
    setBonusEditErr(null)
  }, [bonusBalance])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  function handleBonusBalanceEdit(e: FormEvent) {
    e.preventDefault()
    if (!isAdmin) return
    setBonusEditErr(null)
    const n = parseInt(bonusEditValue, 10)
    if (!Number.isFinite(n) || n < 0) {
      setBonusEditErr(t('account.bonusErr'))
      return
    }
    setBonusBalance(accountEmail, n)
  }

  return (
    <main className="account-app">
      <div className="account-app__shell">
        <header className="account-app__hero">
          <div className="account-app__hero-main">
            <div className="account-app__hero-avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="account-app__hero-text">
              <h1 className="account-app__hero-name">{user.name}</h1>
              <p className="account-app__hero-email">{maskEmail(user.email)}</p>
              {user.role === 'admin' ? (
                <p className="account-app__hero-role">{t('account.role')}</p>
              ) : null}
            </div>
          </div>
        </header>

        <section className="account-app__promos" aria-label={t('account.promosAria')}>
          <Link to="/catalog" className="account-app__promo account-app__promo--club">
            <span className="account-app__promo-icon" aria-hidden="true">
              ◆
            </span>
            <span className="account-app__promo-body">
              <span className="account-app__promo-title">{t('account.clubTitle')}</span>
              <span className="account-app__promo-sub">{t('account.clubSub')}</span>
            </span>
            <span className="account-app__promo-chevron">›</span>
          </Link>
          <Link to="/search" className="account-app__promo account-app__promo--smart">
            <span className="account-app__promo-icon account-app__promo-icon--s" aria-hidden="true">
              s!
            </span>
            <span className="account-app__promo-body">
              <span className="account-app__promo-title">{t('account.searchTitle')}</span>
              <span className="account-app__promo-sub">{t('account.searchSub')}</span>
            </span>
            <span className="account-app__promo-chevron">›</span>
          </Link>
        </section>

        <section className="account-app__bonus-card" aria-labelledby="account-bonus-title">
          <div className="account-app__bonus-card-top">
            <span className="account-app__bonus-icon" aria-hidden="true">
              Б
            </span>
            <div>
              <h2 id="account-bonus-title" className="account-app__bonus-title">
                {t('account.bonusTitle')}
              </h2>
              <p className="account-app__bonus-balance">
                <strong>{formatUahAmount(bonusBalance)}</strong> {t('account.bonusBal')}
                <span className="account-app__bonus-eq"> {t('account.bonusEq')}</span>
              </p>
            </div>
          </div>
          <p className="account-app__bonus-desc">{t('account.bonusDesc')}</p>
          {isAdmin ? (
            <form className="account-app__bonus-admin" onSubmit={handleBonusBalanceEdit}>
              <p className="account-app__bonus-admin-title">{t('account.bonusAdminTitle')}</p>
              <p className="account-app__bonus-admin-hint">{t('account.bonusAdminHint')}</p>
              <div className="account-app__bonus-admin-row">
                <input
                  type="number"
                  min={0}
                  className="auth-field__input account-app__bonus-admin-input"
                  placeholder={t('account.bonusPh')}
                  value={bonusEditValue}
                  onChange={(e) => setBonusEditValue(e.target.value)}
                  aria-label="Новий баланс бонусних балів"
                />
                <button type="submit" className="account-app__bonus-admin-btn">
                  {t('account.save')}
                </button>
              </div>
              {bonusEditErr ? (
                <p className="account-app__bonus-admin-err" role="alert">
                  {bonusEditErr}
                </p>
              ) : null}
            </form>
          ) : null}
        </section>

        <nav className="account-app__menu" aria-label={t('account.menuAria')}>
          <MenuRow
            to="/account/orders"
            icon={<IconOrders />}
            label={t('account.orders')}
            badge={orderCount}
          />
          <MenuRow
            to="/favorites"
            icon={<IconHeart />}
            label={t('account.favorites')}
            badge={favoriteCount}
          />
          <MenuRow to="/cart" icon={<IconCart />} label={t('account.cart')} badge={cartItemCount} />
          <MenuRow to="/catalog" icon={<IconGrid />} label={t('account.catalog')} />
          <MenuRow to="/search" icon={<IconSearch />} label={t('account.searchNav')} />

          <div className="account-app__menu-gap" role="presentation" />

          <MenuRow to="/" icon={<IconHome />} label={t('account.home')} />
          <MenuRow to="/catalog" icon={<IconPercent />} label={t('account.deals')} accent />

          <div className="account-app__menu-gap" role="presentation" />

          <MenuRow to="/checkout" icon={<IconCart />} label={t('account.checkout')} />

          {user.role === 'admin' ? (
            <MenuRow to="/admin" icon={<IconShield />} label={t('account.adminPanel')} />
          ) : null}

          <div className="account-app__menu-gap" role="presentation" />

          <div className="account-app__details">
            <h2 className="account-app__details-title">
              <IconSettings width={18} height={18} className="account-app__details-gear" />
              {t('account.details')}
            </h2>
            <p className="account-app__details-line">
              <span className="account-app__details-k">{t('account.emailLbl')}</span>
              <span className="account-app__details-v">{user.email}</span>
            </p>
            <p className="account-app__details-note">{t('account.demoNote')}</p>
          </div>

          <button
            type="button"
            className="account-menu-row account-menu-row--btn"
            onClick={handleLogout}
          >
            <span className="account-menu-row__icon" aria-hidden="true">
              <IconLogout />
            </span>
            <span className="account-menu-row__label">{t('account.logoutFull')}</span>
            <span className="account-menu-row__spacer" />
          </button>
        </nav>
      </div>
    </main>
  )
}
