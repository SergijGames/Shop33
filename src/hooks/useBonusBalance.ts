/**
 * Shop31 — хук бонусного балансу за email з підпискою на зміни bonusStorage.
 * Зв’язки: CheckoutPage, AccountPage, bonusStorage.ts
 */
import { useMemo, useSyncExternalStore } from 'react'
import { getBonusBalance, getBonusRevision, subscribeBonus } from '../shop/bonusStorage'

export function useBonusBalance(email: string | undefined): number {
  const revision = useSyncExternalStore(subscribeBonus, getBonusRevision, () => 0)
  return useMemo(() => (email ? getBonusBalance(email) : 0), [email, revision])
}
