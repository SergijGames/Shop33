/**
 * Shop31 — вхід користувача (email/пароль, демо в localStorage).
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

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }
  if (user) {
    return <Navigate to="/" replace />
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const result = login(email, password)
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

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
            <input
              className="auth-field__input"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={1}
            />
          </label>

          <button type="submit" className="auth-form__submit">
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
