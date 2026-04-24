/**
 * Shop31 — оболонка адмін-панелі: бічне меню, маршрути /admin/*, захист AdminGate.
 * Зв’язки: App.tsx, AuthContext (роль admin), pages/admin/*
 */
import { useEffect } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AdminGate() {
  const { user } = useAuth()
  const location = useLocation()

  if (user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function AdminShell() {
  const { logout } = useAuth()
  const { pathname, search } = useLocation()

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [pathname, search])

  return (
    <div className="admin-app">
      <div className="admin-app__ambient" aria-hidden="true" />
      <header className="admin-app__header">
        <div className="admin-app__header-scan" aria-hidden="true" />
        <div className="container admin-app__header-inner">
          <Link to="/admin" className="admin-app__brand">
            <span className="admin-app__brand-mark">Shop31</span>
            <span className="admin-app__brand-tag">Admin</span>
          </Link>
          <nav className="admin-app__nav" aria-label="Адмін-панель">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `admin-app__nav-link${isActive ? ' admin-app__nav-link--active' : ''}`
              }
            >
              Огляд
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `admin-app__nav-link${isActive ? ' admin-app__nav-link--active' : ''}`
              }
            >
              Користувачі
            </NavLink>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `admin-app__nav-link${isActive ? ' admin-app__nav-link--active' : ''}`
              }
            >
              Замовлення
            </NavLink>
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `admin-app__nav-link${isActive ? ' admin-app__nav-link--active' : ''}`
              }
            >
              Товари
            </NavLink>
            <NavLink
              to="/admin/catalog"
              className={({ isActive }) =>
                `admin-app__nav-link${isActive ? ' admin-app__nav-link--active' : ''}`
              }
            >
              Каталог
            </NavLink>
            <NavLink
              to="/admin/search"
              className={({ isActive }) =>
                `admin-app__nav-link${isActive ? ' admin-app__nav-link--active' : ''}`
              }
            >
              Пошук
            </NavLink>
            <Link to="/" className="admin-app__nav-link admin-app__nav-link--ghost">
              На сайт
            </Link>
            <button type="button" className="admin-app__logout" onClick={() => logout()}>
              Вийти
            </button>
          </nav>
        </div>
      </header>
      <main className="admin-app__main">
        <div className="page-transition" key={pathname + search}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
