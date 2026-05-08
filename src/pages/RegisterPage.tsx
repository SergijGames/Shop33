/**
 * Shop31 — реєстрація акаунта та опційний лист EmailJS.
 * Зв’язки: AuthContext, sendRegistrationThankYou, i18n
 */
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type RegisterThankYouEmail } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { translate } from '../i18n/strings'
import type { Locale } from '../i18n/types'

function registrationFlashMessage(locale: Locale, thankYouEmail: RegisterThankYouEmail): string {
  if (thankYouEmail.ok) {
    return translate(locale, 'reg.flashOk')
  }
  if (thankYouEmail.reason === 'not_configured') {
    return translate(locale, 'reg.flashNotConfigured')
  }
  const hint =
    thankYouEmail.message.length > 140
      ? `${thankYouEmail.message.slice(0, 137)}…`
      : thankYouEmail.message
  return translate(locale, 'reg.flashErr', { hint })
}

export function RegisterPage() {
  const { user, register } = useAuth()
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)

  if (user && user.role !== 'admin' && !submitting) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== password2) {
      setError(t('reg.errMismatch'))
      return
    }
    setSubmitting(true)
    const result = await register(name, email, password)
    if (!result.ok) {
      setError(result.message)
      setSubmitting(false)
      return
    }
    navigate(from, {
      replace: true,
      state: { registrationMsg: registrationFlashMessage(locale, result.thankYouEmail) },
    })
  }

  return (
    <main className="auth-page">
      <div className="auth-card container">
        <h1 className="auth-card__title">{t('reg.title')}</h1>
        <p className="auth-card__lead">{t('reg.lead')}</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error ? (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          ) : null}

          <label className="auth-field">
            <span className="auth-field__label">{t('reg.name')}</span>
            <input
              className="auth-field__input"
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </label>

          <label className="auth-field">
            <span className="auth-field__label">{t('reg.email')}</span>
            <input
              className="auth-field__input"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span className="auth-field__hint">{t('reg.emailHint')}</span>
          </label>

          <label className="auth-field">
            <span className="auth-field__label">{t('reg.password')}</span>
            <div className="auth-field__input-wrap">
              <input
                className="auth-field__input auth-field__input--with-toggle"
                type={showPass ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
            <span className="auth-field__hint">{t('reg.passwordHint')}</span>
          </label>

          <label className="auth-field">
            <span className="auth-field__label">{t('reg.password2')}</span>
            <div className="auth-field__input-wrap">
              <input
                className="auth-field__input auth-field__input--with-toggle"
                type={showPass2 ? 'text' : 'password'}
                name="password2"
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                className="auth-field__toggle"
                onClick={() => setShowPass2((v) => !v)}
                aria-label={showPass2 ? 'Сховати пароль' : 'Показати пароль'}
              >
                {showPass2 ? '🙈' : '👁'}
              </button>
            </div>
          </label>

          <button type="submit" className="auth-form__submit" disabled={submitting}>
            {submitting ? t('reg.wait') : t('reg.submit')}
          </button>
        </form>

        <p className="auth-card__switch">
          {t('reg.switch')}{' '}
          <Link to="/login" state={location.state}>
            {t('reg.signIn')}
          </Link>
        </p>
      </div>
    </main>
  )
}
