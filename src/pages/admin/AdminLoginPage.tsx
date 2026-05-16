/**
 * Shop31 — вхід у адмін-панель (обліковий запис admin у базі).
 * Зв’язки: AuthContext, ADMIN_* константи
 */
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { hasApiBase } from '../../api/client'

const RENDER_DEPLOY_URL =
  'https://render.com/deploy?repo=https://github.com/SergijGames/Shop33'

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

  const onGitHubPages =
    typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')
  const needsRemoteApi = onGitHubPages && !hasApiBase()
  // У dev (npm run dev) запити /api йдуть через проксі Vite — підказка не потрібна.
  const needsLocalApi =
    !import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    !onGitHubPages &&
    !hasApiBase() &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

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

          {needsRemoteApi ? (
            <div className="admin-login-setup" role="status">
              <p className="admin-login-setup__title">Потрібен API (один раз)</p>
              <ol className="admin-login-setup__list">
                <li>
                  <a href={RENDER_DEPLOY_URL} target="_blank" rel="noreferrer">
                    Задеплоїти API на Render
                  </a>{' '}
                  (з репо Shop33, файл render.yaml).
                </li>
                <li>
                  У Render → Environment додати: <code>JWT_SECRET</code>,{' '}
                  <code>SEED_ADMIN_EMAIL</code>, <code>SEED_ADMIN_PASSWORD</code> (як у server/.env).
                </li>
                <li>
                  GitHub → Shop33 → Settings → Secrets → Actions:{' '}
                  <code>VITE_API_BASE_URL</code> = URL сервісу Render (без / в кінці).
                </li>
                <li>Actions → Re-run workflow «Deploy to GitHub Pages».</li>
              </ol>
            </div>
          ) : null}

          {needsLocalApi ? (
            <p className="admin-login-setup admin-login-setup--local" role="status">
              Локально: у корені проєкту запустіть <code>npm run dev:all</code>, у{' '}
              <code>server/.env</code> — <code>DATABASE_URL</code> і <code>SEED_ADMIN_*</code>, потім{' '}
              <code>npm run db:setup</code>.
            </p>
          ) : null}

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
