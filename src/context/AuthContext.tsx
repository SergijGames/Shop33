/**
 * Shop31 — контекст автентифікації (користувач, вхід/вихід, реєстрація).
 * Стан у localStorage через auth/storage; використовується в Layout, сторінках акаунта.
 * Зв’язки: auth/storage.ts, LoginPage, RegisterPage, App.tsx
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
  readUsers,
  writeSession,
  writeUsers,
  type UserSession,
} from '../auth/storage'
import {
  ADMIN_DISPLAY_NAME,
  ADMIN_EMAIL,
  isAdminCredentials,
} from '../config/adminDemo'
import { parseMailbox } from '../utils/email'
import { openRegistrationMailtoFallback } from '../utils/customerEmailFlow'
import {
  sendRegistrationThankYou,
  type RegistrationThankYouResult,
} from '../utils/sendRegistrationThankYou'

export type LoginResult =
  | { ok: true; role: 'admin' | 'user' }
  | { ok: false; message: string }

export type RegisterThankYouEmail = RegistrationThankYouResult

type AuthContextValue = {
  user: UserSession | null
  login: (email: string, password: string) => LoginResult
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
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function setSessionAndNotify(next: UserSession | null) {
  sessionSnapshot = next
  writeSession(next)
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return sessionSnapshot
}

function getServerSnapshot() {
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    clearLegacyUserStores()
    const s = readSession()
    let next: UserSession | null = s
    if (s && s.role !== 'admin') {
      const users = readUsers()
      if (!users.some((u) => u.email === s.email)) {
        next = null
        writeSession(null)
      }
    }
    if (next !== sessionSnapshot) {
      sessionSnapshot = next
      emit()
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('shop31_auth')) {
        sessionSnapshot = readSession()
        emit()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback((email: string, password: string): LoginResult => {
    const parsed = parseMailbox(email)
    if (!parsed.ok) {
      return { ok: false, message: parsed.message }
    }
    if (isAdminCredentials(email, password)) {
      setSessionAndNotify({
        email: ADMIN_EMAIL,
        name: ADMIN_DISPLAY_NAME,
        role: 'admin',
      })
      return { ok: true, role: 'admin' }
    }
    const users = readUsers()
    const found =
      users.find((u) => u.email === parsed.email) ??
      users.find((u) => u.email === email.trim().toLowerCase())
    if (!found || found.password !== password) {
      return { ok: false, message: 'Невірна пошта або пароль.' }
    }
    setSessionAndNotify({ email: found.email, name: found.name })
    return { ok: true, role: 'user' }
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
    if (parsed.email === ADMIN_EMAIL) {
      return { ok: false as const, message: 'Ця пошта зарезервована для облікового запису адміністратора.' }
    }
    const users = readUsers()
    if (
      users.some(
        (u) => u.email === parsed.email || u.email === email.trim().toLowerCase(),
      )
    ) {
      return { ok: false as const, message: 'Користувач з такою поштою вже зареєстрований.' }
    }
    const next = [...users, { email: parsed.email, name: trimmedName, password }]
    writeUsers(next)
    const wasAdmin = readSession()?.role === 'admin'
    const thankYouEmail = await sendRegistrationThankYou({
      email: parsed.email,
      name: trimmedName,
    })
    openRegistrationMailtoFallback(trimmedName, parsed.email, thankYouEmail)
    if (!wasAdmin) {
      setSessionAndNotify({ email: parsed.email, name: trimmedName })
    }
    return { ok: true as const, thankYouEmail }
  }, [])

  const logout = useCallback(() => {
    setSessionAndNotify(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
