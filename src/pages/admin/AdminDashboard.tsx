/**
 * Shop31 — головна адмін-панелі: зведена статистика та посилання в розділи.
 * Зв’язки: AdminShell, auth/storage, orders, products, adminCustomProductsStorage
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { readUsers } from '../../auth/storage'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../api/client'
import { getShopProducts } from '../../data/catalog'
import { products } from '../../data/products'
import { loadCustomProducts } from '../../shop/adminCustomProductsStorage'
import { readOrders } from '../../shop/ordersStorage'

export function AdminDashboard() {
  const { token } = useAuth()
  const [buyersCount, setBuyersCount] = useState(() => readUsers().length)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!token) {
        if (!cancelled) setBuyersCount(readUsers().length)
        return
      }
      const r = await apiFetch<{ ok: true; users: unknown[] }>('/api/admin/users', { token })
      if (cancelled) return
      if (!r.ok) {
        setBuyersCount(readUsers().length)
        return
      }
      setBuyersCount(r.data.users.length)
    })()
    return () => {
      cancelled = true
    }
  }, [token])
  const orders = readOrders()
  const visible = getShopProducts()
  const custom = loadCustomProducts()

  return (
    <div className="container admin-dashboard admin-dashboard--home">
      <header className="admin-hero">
        <p className="admin-hero__eyebrow">Shop31 · Command</p>
        <h1 className="admin-dashboard__title admin-hero__title">Огляд магазину</h1>
        <p className="admin-dashboard__lead admin-hero__lead">
          Панель керування: швидкий огляд вітрини, замовлень і користувачів. Товари можна вести через
          розділ «Товари» та опублікувати в базу для вітрини.
        </p>
      </header>

      <div className="admin-stats admin-stats--fancy">
        <div className="admin-stat admin-stat--cyan admin-stat--lift">
          <span className="admin-stat__icon" aria-hidden="true">
            ◈
          </span>
          <span className="admin-stat__value">{visible.length}</span>
          <span className="admin-stat__label">На вітрині зараз</span>
        </div>
        <div className="admin-stat admin-stat--lime admin-stat--lift">
          <span className="admin-stat__icon" aria-hidden="true">
            ✦
          </span>
          <span className="admin-stat__value">{custom.length}</span>
          <span className="admin-stat__label">Ваші додані товари</span>
        </div>
        <div className="admin-stat admin-stat--magenta admin-stat--lift">
          <span className="admin-stat__icon" aria-hidden="true">
            ◎
          </span>
          <span className="admin-stat__value">{buyersCount}</span>
          <span className="admin-stat__label">Покупці</span>
        </div>
        <div className="admin-stat admin-stat--violet admin-stat--lift">
          <span className="admin-stat__icon" aria-hidden="true">
            ⌁
          </span>
          <span className="admin-stat__value">{orders.length}</span>
          <span className="admin-stat__label">Замовлення</span>
        </div>
        <div className="admin-stat admin-stat--cyan admin-stat--lift admin-stat--dim">
          <span className="admin-stat__icon" aria-hidden="true">
            ⎔
          </span>
          <span className="admin-stat__value">{products.length}</span>
          <span className="admin-stat__label">У базі з коду</span>
        </div>
      </div>

      <section className="admin-glass admin-panel--links">
        <h2 className="admin-glass__title">Керування</h2>
        <ul className="admin-quick-links admin-quick-links--tiles">
          <li>
            <Link to="/admin/users" className="admin-tile-link">
              <span className="admin-tile-link__label">Користувачі</span>
              <span className="admin-tile-link__hint">список, видалення</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/orders" className="admin-tile-link">
              <span className="admin-tile-link__label">Замовлення</span>
              <span className="admin-tile-link__hint">деталі, очистка</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/products" className="admin-tile-link admin-tile-link--hot">
              <span className="admin-tile-link__label">Товари</span>
              <span className="admin-tile-link__hint">додати свої + база</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/catalog" className="admin-tile-link">
              <span className="admin-tile-link__label">Каталог</span>
              <span className="admin-tile-link__hint">тексти та картки категорій</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/search" className="admin-tile-link">
              <span className="admin-tile-link__label">Пошук</span>
              <span className="admin-tile-link__hint">підказка та синоніми</span>
            </Link>
          </li>
        </ul>
        <p className="admin-panel__note admin-panel__note--tight">
          Паролі користувачів не відображаються. Доступ до адмінки — лише для ролі <code className="admin-code">admin</code>.
        </p>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel__heading">На сайт</h2>
        <ul className="admin-quick-links">
          <li>
            <Link to="/catalog">Каталог</Link>
          </li>
          <li>
            <Link to="/search">Пошук</Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
