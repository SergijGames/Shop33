/**
 * Shop31 — список збережених замовлень користувача (демо в localStorage).
 * Зв’язки: AuthContext, ordersStorage, i18n
 */
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconOrders } from '../components/AccountProfileIcons'
import { useI18n } from '../i18n/I18nContext'
import { readOrders } from '../shop/ordersStorage'
import { formatUahAmount } from '../utils/formatMoney'

export function UserOrdersPage() {
  const { locale, t } = useI18n()
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: { pathname: '/account/orders' } }} />
  }

  const orders = readOrders()

  return (
    <main className="account-app account-app--sub">
      <div className="account-app__shell">
        <Link to="/account" className="account-app__back">
          {t('orders.back')}
        </Link>
        <h1 className="account-app__page-title">{t('orders.title')}</h1>
        <p className="account-app__page-lead">{t('orders.lead')}</p>

        {orders.length === 0 ? (
          <p className="account-app__empty">{t('orders.empty')}</p>
        ) : (
          <ul className="account-app__order-list">
            {orders.map((o) => (
              <li key={o.id}>
                <Link to={`/order-thanks?id=${encodeURIComponent(o.id)}`} className="account-app__order-card">
                  <span className="account-app__order-icon" aria-hidden="true">
                    <IconOrders />
                  </span>
                  <span className="account-app__order-body">
                    <span className="account-app__order-id">{o.id}</span>
                    <span className="account-app__order-meta">
                      {new Date(o.createdAt).toLocaleString(locale === 'en' ? 'en-GB' : 'uk-UA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      {o.lines.length} {t('orders.pos')}
                    </span>
                  </span>
                  <span className="account-app__order-sum">{formatUahAmount(o.totalUah)} ₴</span>
                  <span className="account-app__order-chevron" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
