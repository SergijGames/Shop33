/**
 * Shop31 — вхід у адмінку за демо email/паролем (config/adminDemo).
 * Зв’язки: AuthContext, ADMIN_* константи
 */
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../../config/adminDemo'
import { useAuth } from '../../context/AuthContext'

export function AdminLoginPage() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [])

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const result = login(email, password)
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (result.role !== 'admin') {
      logout()
      setError('Цей обліковий запис не має прав адміністратора.')
      return
    }
    navigate(from === '/admin/login' ? '/admin' : from, { replace: true })
  }

  return (
    <div className="admin-login-page page-transition">
      <main className="auth-page">
        <div className="auth-card container auth-card--admin">
          <p className="auth-card__badge">Адміністратор</p>
          <h1 className="auth-card__title">Вхід у панель</h1>
          <p className="auth-card__lead">
            Доступ лише для адміністратора магазину. Демо-логін і пароль показані нижче
            (змініть у коді або через змінні середовища Vite).
          </p>
          <p className="admin-login__demo">
            <strong>Демо:</strong> {ADMIN_EMAIL}
            <br />
            <strong>Пароль:</strong> {ADMIN_PASSWORD}
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error ? (
              <p className="auth-form__error" role="alert">
                {error}
              </p>
            ) : null}

            <label className="auth-field">
              <span className="auth-field__label">Електронна пошта</span>
              <input
                className="auth-field__input"
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-field__label">Пароль</span>
              <input
                className="auth-field__input"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button type="submit" className="auth-form__submit auth-form__submit--magenta">
              Увійти як адмін
            </button>
          </form>

          <p className="auth-card__switch">
            <Link to="/">← На головну</Link>
            {' · '}
            <Link to="/login">Звичайний вхід</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
