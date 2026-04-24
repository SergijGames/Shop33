/**
 * Shop31 — ініціали з імені для аватара в шапці та акаунті (1–2 літери).
 * Зв’язки: Layout.tsx, AccountPage
 */
export function userDisplayInitials(name: string): string {
  const t = name.trim()
  if (!t) return '?'
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0][0] ?? ''
    const b = parts[1][0] ?? ''
    return (a + b).toUpperCase()
  }
  return t.slice(0, 2).toUpperCase()
}
