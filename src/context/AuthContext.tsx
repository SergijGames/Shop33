/**
 * Shop31 — контекст автентифікації (користувач, вхід/вихід, реєстрація).
 * Реальний режим: бекенд /api/auth/* + JWT у localStorage.
 * Зв’язки: auth/storage.ts (сесія+токен), pages Login/Register/AdminLogin
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import {
  clearLegacyUserStores,
  readSession,
  readAuthToken,
  writeSession,
  writeAuthToken,
  type UserSession,
} from '../auth/storage'
import { parseMailbox } from '../utils/email'
import { openRegistrationMailtoFallback } from '../utils/customerEmailFlow'
import {
  sendRegistrationThankYou,
  type RegistrationThankYouResult,
} from '../utils/sendRegistrationThankYou'
import { apiFetch } from '../api/client'

export type LoginResult =
  | { ok: true; role: 'admin' | 'user' }
  | { ok: false; message: string }

export type RegisterThankYouEmail = RegistrationThankYouResult

type AuthContextValue = {
  user: UserSession | null
  token: string
  login: (email: string, password: string) => Promise<LoginResult>
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<
    { ok: true; thankYouEmail: RegisterThankYouEmail } | { ok: false; message: string }
  >
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

let sessionSnapshot: UserSession | null = readSession()
let tokenSnapshot: string = readAuthToken()
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function setSessionAndNotify(next: UserSession | null) {
  sessionSnapshot = next
  writeSession(next)
  emit()
}

function setTokenAndNotify(next: string) {
  tokenSnapshot = next
  writeAuthToken(next)
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSessionSnapshot() {
  return sessionSnapshot
}

function getTokenSnapshot() {
  return tokenSnapshot
}

function getServerSessionSnapshot() {
  return null
}

function getServerTokenSnapshot() {
  return ''
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(
    subscribe,
    getSessionSnapshot,
    getServerSessionSnapshot,
  )
  const token = useSyncExternalStore(
    subscribe,
    getTokenSnapshot,
    getServerTokenSnapshot,
  )

  useEffect(() => {
    clearLegacyUserStores()
    sessionSnapshot = readSession()
    tokenSnapshot = readAuthToken()
    emit()

    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('shop31_auth')) {
        sessionSnapshot = readSession()
        tokenSnapshot = readAuthToken()
        emit()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Якщо токен є — спробувати підтягнути профіль.
  useEffect(() => {
    if (!token) return
    if (user) return
    void (async () => {
      const r = await apiFetch<{ ok: true; user: UserSession }>('/api/auth/me', { token })
      if (!r.ok) {
        setTokenAndNotify('')
        setSessionAndNotify(null)
        return
      }
      setSessionAndNotify(r.data.user)
    })()
  }, [token, user])

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const parsed = parseMailbox(email)
    if (!parsed.ok) {
      return { ok: false, message: parsed.message }
    }
    const r = await apiFetch<{ ok: true; token: string | null; user: UserSession }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email: parsed.email, password }) },
    )
    if (!r.ok) return { ok: false, message: r.error.message }
    setTokenAndNotify(r.data.token ?? '')
    setSessionAndNotify(r.data.user)
    return { ok: true, role: r.data.user.role === 'admin' ? 'admin' : 'user' }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const trimmedName = name.trim()
    const parsed = parseMailbox(email)
    if (trimmedName.length < 2) {
      return { ok: false as const, message: 'Вкажіть ім’я (мінімум 2 символи).' }
    }
    if (!parsed.ok) {
      return { ok: false as const, message: parsed.message }
    }
    if (password.length < 8) {
      return { ok: false as const, message: 'Пароль має бути не коротший за 8 символів.' }
    }
    const wasAdmin = readSession()?.role === 'admin'
    const r = await apiFetch<{ ok: true; token: string | null; user: UserSession }>(
      '/api/auth/register',
      { method: 'POST', body: JSON.stringify({ name: trimmedName, email: parsed.email, password }) },
    )
    if (!r.ok) return { ok: false as const, message: r.error.message }

    const thankYouEmail = await sendRegistrationThankYou({
      email: parsed.email,
      name: trimmedName,
    })
    openRegistrationMailtoFallback(trimmedName, parsed.email, thankYouEmail)
    if (!wasAdmin) {
      setTokenAndNotify(r.data.token ?? '')
      setSessionAndNotify(r.data.user)
    }
    return { ok: true as const, thankYouEmail }
  }, [])

  const logout = useCallback(() => {
    setTokenAndNotify('')
    setSessionAndNotify(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, login, register, logout }),
    [user, token, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
