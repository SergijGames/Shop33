/**
 * Shop31 — збереження зареєстрованих користувачів і поточної сесії (localStorage, демо).
 * Зв’язки: AuthContext.tsx, LoginPage, RegisterPage
 */
export type StoredUser = {
  email: string
  name: string
  /** Демо: пароль у відкритому вигляді лише в браузері, не для продакшену. */
  password: string
}

export type UserSession = {
  email: string
  name: string
  role?: 'admin'
}

/** v4: усі старі списки користувачів видаляються при старті (залишається лише вхід адміна). */
const USERS_KEY = 'shop31_auth_users_v4'
const SESSION_KEY = 'shop31_auth_session_v1'

const LEGACY_USER_KEYS = [
  'shop31_auth_users_v1',
  'shop31_auth_users_v2',
  'shop31_auth_users_v3',
] as const

/** Видаляє старі сховища зареєстрованих користувачів (адмін не зберігається в цьому списку). */
export function clearLegacyUserStores(): void {
  for (const key of LEGACY_USER_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
}

export function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : []
  } catch {
    return []
  }
}

export function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function deleteUserByEmail(email: string): void {
  const normalized = email.trim().toLowerCase()
  writeUsers(
    readUsers().filter((u) => u.email.trim().toLowerCase() !== normalized),
  )
}

export function clearAllUsers(): void {
  writeUsers([])
}

export function readSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as UserSession
    if (s && typeof s.email === 'string' && typeof s.name === 'string') {
      return {
        email: s.email,
        name: s.name,
        ...(s.role === 'admin' ? { role: 'admin' as const } : {}),
      }
    }
    return null
  } catch {
    return null
  }
}

export function writeSession(session: UserSession | null): void {
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}
