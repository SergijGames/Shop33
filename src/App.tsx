/**
 * Shop31 — кореневий компонент: маршрутизація та провайдери.
 * Маршрути вітрини й /admin/*; обгортки I18n, Auth, Shop.
 * Зв’язки: Layout.tsx, AdminShell.tsx, pages/*, context/*
 */
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { AdminGate, AdminShell } from './components/AdminShell'
import { Layout } from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { ShopProvider } from './context/ShopContext'
import { I18nProvider } from './i18n/I18nContext'
import { CatalogCategoryPage } from './pages/CatalogCategoryPage'
import { CatalogIndexPage } from './pages/CatalogIndexPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProductPage } from './pages/ProductPage'
import { RegisterPage } from './pages/RegisterPage'
import { SearchPage } from './pages/SearchPage'
import { CartPage } from './pages/CartPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderThanksPage } from './pages/OrderThanksPage'
import { AccountPage } from './pages/AccountPage'
import { UserOrdersPage } from './pages/UserOrdersPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminCatalogPage } from './pages/admin/AdminCatalogPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminSearchPage } from './pages/admin/AdminSearchPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { useEffect } from 'react'
import { apiFetch } from './api/client'
import { setRuntimeProducts } from './data/runtimeCatalog'
import type { Product } from './data/products'
import './App.css'

const Iphone17Redirect = () => (
  <Navigate to="/product/iphone-17-pro-256-cosmic-orange" replace />
)

/** file:// не підтримує History API — потрібен hash-роутинг (після npm run build → dist). */
const Router =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? HashRouter
    : BrowserRouter

/** Для GitHub Pages (`vite build --base=/repo/`): підшлях у React Router. */
function appRouterBasename(): string | undefined {
  const base = import.meta.env.BASE_URL
  if (base === '/' || base === './') return undefined
  return base.endsWith('/') ? base.slice(0, -1) : base
}

function App() {
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const r = await apiFetch<{ ok: true; products: Product[] }>('/api/catalog/products')
      if (!r.ok) return
      if (cancelled) return
      if (Array.isArray(r.data.products) && r.data.products.length > 0) {
        setRuntimeProducts(r.data.products)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Router basename={appRouterBasename()}>
      <I18nProvider>
        <AuthProvider>
          <ShopProvider>
        <Routes>
          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin" element={<AdminGate />}>
            <Route element={<AdminShell />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="catalog" element={<AdminCatalogPage />} />
              <Route path="search" element={<AdminSearchPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="catalog" element={<CatalogIndexPage />} />
            <Route path="catalog/:categoryId" element={<CatalogCategoryPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-thanks" element={<OrderThanksPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="account/orders" element={<UserOrdersPage />} />
            <Route path="product/iphone-17-pro-ultra" element={<Iphone17Redirect />} />
            <Route path="product/:productId" element={<ProductPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
          </ShopProvider>
        </AuthProvider>
      </I18nProvider>
    </Router>
  )
}

export default App
