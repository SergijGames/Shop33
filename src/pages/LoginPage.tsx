/**
 * Shop31 — вхід користувача (email/пароль через API).
 * Зв’язки: AuthContext, auth/storage, i18n
 */
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export function LoginPage() {
  const { t } = useI18n()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }
  if (user) {
    return <Navigate to="/" replace />
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
    if (result.role === 'admin') {
      navigate(from.startsWith('/admin') ? from : '/admin', { replace: true })
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <main className="auth-page">
      <div className="auth-card container">
        <h1 className="auth-card__title">{t('login.title')}</h1>
        <p className="auth-card__lead">{t('login.lead')}</p>

        <form className="auth-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          {error ? (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          ) : null}

          <label className="auth-field">
            <span className="auth-field__label">{t('login.email')}</span>
            <input
              className="auth-field__input"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span className="auth-field__hint">{t('login.emailHint')}</span>
          </label>

          <label className="auth-field">
            <span className="auth-field__label">{t('login.password')}</span>
            <div className="auth-field__input-wrap">
              <input
                className="auth-field__input auth-field__input--with-toggle"
                type={showPass ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={1}
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

          <button type="submit" className="auth-form__submit" disabled={busy}>
            {t('login.submit')}
          </button>
        </form>

        <p className="auth-card__switch">
          {t('login.switch')}{' '}
          <Link to="/register" state={location.state}>
            {t('login.register')}
          </Link>
        </p>
      </div>
    </main>
  )
}
