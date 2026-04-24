/**
 * Shop31 — маскування email для шапки профілю (показ без повного адреса).
 * Зв’язки: Layout.tsx, AccountPage
 */
export function maskEmail(email: string): string {
  const t = email.trim()
  const at = t.indexOf('@')
  if (at < 1) return t
  const local = t.slice(0, at)
  const domain = t.slice(at + 1)
  if (local.length <= 2) return `••@${domain}`
  const head = local.slice(0, Math.min(3, local.length))
  return local.length > 3 ? `${head}•••@${domain}` : `${head}@${domain}`
}
