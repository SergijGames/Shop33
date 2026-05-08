/**
 * Shop31 — застарілі константи для локальної розробки (не використовуйте як прод-модель входу).
 * Зв’язки: AdminLoginPage, AuthContext, змінні VITE_ADMIN_* у .env
 */
import { parseMailbox } from '../utils/email'

/**
 * Адмін-доступ у продакшені налаштовується через `server/.env` (seed admin) та роль `admin` у базі.
 * Зміни пошту/пароль тут або через .env: VITE_ADMIN_EMAIL, VITE_ADMIN_PASSWORD.
 */
const envEmail = import.meta.env.VITE_ADMIN_EMAIL as string | undefined
const envPassword = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined

const rawAdminEmail = (envEmail || 'admin@shop31.ua').trim()
const adminParsed = parseMailbox(rawAdminEmail)
if (!adminParsed.ok) {
  console.warn('[Shop31] VITE_ADMIN_EMAIL має бути коректною поштою:', rawAdminEmail)
}

export const ADMIN_EMAIL = adminParsed.ok ? adminParsed.email : rawAdminEmail.toLowerCase()
export const ADMIN_DISPLAY_NAME = 'Адміністратор'
export const ADMIN_PASSWORD = envPassword || 'shop31admin'

export function isAdminCredentials(email: string, password: string): boolean {
  if (password !== ADMIN_PASSWORD) return false
  const parsed = parseMailbox(email)
  if (parsed.ok) return parsed.email === ADMIN_EMAIL
  return email.trim().toLowerCase() === ADMIN_EMAIL
}
