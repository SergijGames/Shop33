/**
 * Shop31 — вхід у адмін-панель (обліковий запис admin у базі).
 * Зв’язки: AuthContext, ADMIN_* константи
 */
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [])

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const result = await login(email, password)
    setBusy(false)
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
          <p className="auth-card__lead">Доступ лише для адміністратора магазину.</p>

          <form className="auth-form" onSubmit={(ev) => void handleSubmit(ev)} noValidate>
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
              <div className="auth-field__input-wrap">
                <input
                  className="auth-field__input auth-field__input--with-toggle"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-field__toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Сховати пароль' : 'Показати пароль'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="auth-form__submit auth-form__submit--magenta"
              disabled={busy}
            >
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
