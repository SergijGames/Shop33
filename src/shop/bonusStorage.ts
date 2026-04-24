/**
 * Shop31 — бонусні бали по email у localStorage; підписка на зміни (listeners).
 * Зв’язки: CheckoutPage, AccountPage, useBonusBalance, config/bonus.ts
 */
const KEY = 'shop31_bonus_balance_v1'

type Balances = Record<string, number>

const listeners = new Set<() => void>()
let revision = 0

function normEmail(email: string): string {
  return email.trim().toLowerCase()
}

function emit() {
  revision++
  for (const l of listeners) l()
}

export function subscribeBonus(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Для useSyncExternalStore: змінюється лише після операцій з бонусами. */
export function getBonusRevision(): number {
  return revision
}

function readAll(): Balances {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const p: unknown = JSON.parse(raw)
    return p && typeof p === 'object' && !Array.isArray(p) ? (p as Balances) : {}
  } catch {
    return {}
  }
}

function writeAll(m: Balances): void {
  localStorage.setItem(KEY, JSON.stringify(m))
  emit()
}

export function getBonusBalance(email: string): number {
  const v = readAll()[normEmail(email)]
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
}

export function setBonusBalance(email: string, amount: number): void {
  const m = readAll()
  m[normEmail(email)] = Math.max(0, Math.floor(amount))
  writeAll(m)
}

export function addBonus(email: string, delta: number): number {
  const next = Math.max(0, getBonusBalance(email) + Math.floor(delta))
  setBonusBalance(email, next)
  return next
}

export function spendBonus(
  email: string,
  amount: number,
): { ok: true; balance: number } | { ok: false; message: string } {
  const a = Math.floor(amount)
  if (a <= 0) return { ok: true, balance: getBonusBalance(email) }
  const bal = getBonusBalance(email)
  if (a > bal) return { ok: false, message: 'Недостатньо бонусних балів.' }
  setBonusBalance(email, bal - a)
  return { ok: true, balance: bal - a }
}
