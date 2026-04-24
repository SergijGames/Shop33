/**
 * Shop31 — адмін: список зареєстрованих користувачів (демо localStorage).
 * Зв’язки: auth/storage.ts
 */
import type { FormEvent } from 'react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { clearAllUsers, deleteUserByEmail, readUsers } from '../../auth/storage'
import {
  getBonusBalance,
  getBonusRevision,
  setBonusBalance,
  subscribeBonus,
} from '../../shop/bonusStorage'
import { parseMailbox } from '../../utils/email'
import { formatUahAmount } from '../../utils/formatMoney'

export function AdminUsersPage() {
  const [users, setUsers] = useState(readUsers)
  const bonusRevision = useSyncExternalStore(subscribeBonus, getBonusRevision, () => 0)
  const [balanceDrafts, setBalanceDrafts] = useState<Record<string, string>>({})
  const [rowErr, setRowErr] = useState<Record<string, string | null>>({})
  const [otherEmail, setOtherEmail] = useState('')
  const [otherBalance, setOtherBalance] = useState('')
  const [otherErr, setOtherErr] = useState<string | null>(null)

  function refresh() {
    setUsers(readUsers())
  }

  useEffect(() => {
    setBalanceDrafts((prev) => {
      const next: Record<string, string> = {}
      for (const u of users) {
        next[u.email] = prev[u.email] ?? String(getBonusBalance(u.email))
      }
      return next
    })
  }, [users])

  function handleRowBonusSubmit(email: string, e: FormEvent) {
    e.preventDefault()
    setRowErr((r) => ({ ...r, [email]: null }))
    const raw = balanceDrafts[email] ?? String(getBonusBalance(email))
    const n = parseInt(raw, 10)
    if (!Number.isFinite(n) || n < 0) {
      setRowErr((r) => ({
        ...r,
        [email]: 'Потрібне невід’ємне ціле число балів.',
      }))
      return
    }
    setBonusBalance(email, n)
    setBalanceDrafts((p) => ({ ...p, [email]: String(n) }))
  }

  function resetBonusDraft(email: string) {
    setBalanceDrafts((p) => ({ ...p, [email]: String(getBonusBalance(email)) }))
    setRowErr((r) => ({ ...r, [email]: null }))
  }

  function handleOtherBonusSubmit(e: FormEvent) {
    e.preventDefault()
    setOtherErr(null)
    const parsed = parseMailbox(otherEmail)
    if (!parsed.ok) {
      setOtherErr(parsed.message)
      return
    }
    const n = parseInt(otherBalance, 10)
    if (!Number.isFinite(n) || n < 0) {
      setOtherErr('Потрібне невід’ємне ціле число балів.')
      return
    }
    setBonusBalance(parsed.email, n)
    setOtherBalance(String(n))
  }

  function handleDelete(email: string) {
    if (!window.confirm(`Видалити користувача ${email}? Цю дію не скасувати.`)) {
      return
    }
    deleteUserByEmail(email)
    refresh()
  }

  function handleClearAll() {
    if (
      !window.confirm(
        'Видалити всіх зареєстрованих покупців з цього браузера? Обліковий запис адміна не в цьому списку.',
      )
    ) {
      return
    }
    clearAllUsers()
    refresh()
  }

  return (
    <div className="container admin-dashboard" data-bonus-revision={bonusRevision}>
      <h1 className="admin-dashboard__title">Користувачі</h1>
      <p className="admin-dashboard__lead">
        Список покупців з localStorage на цьому пристрої. Паролі не показуємо. Бонусний баланс можна
        змінити для кожного покупця (демо, лише в цьому браузері).
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" className="admin-app__logout" onClick={handleClearAll}>
          Очистити всіх
        </button>
      </div>

      {users.length === 0 ? (
        <p className="admin-panel__empty">Поки що немає зареєстрованих покупців.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ім’я</th>
                <th>Пошта</th>
                <th>Бонуси (б.)</th>
                <th>Змінити баланс</th>
                <th style={{ width: '100px' }}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const live = getBonusBalance(u.email)
                const draft = balanceDrafts[u.email] ?? String(live)
                return (
                  <tr key={u.email}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <strong>{formatUahAmount(live)}</strong>
                    </td>
                    <td>
                      <form
                        className="admin-user-bonus-form"
                        onSubmit={(e) => handleRowBonusSubmit(u.email, e)}
                      >
                        <div className="admin-user-bonus-form__row">
                          <input
                            type="number"
                            min={0}
                            className="auth-field__input admin-user-bonus-form__input"
                            aria-label={`Новий баланс балів для ${u.email}`}
                            value={draft}
                            onChange={(e) =>
                              setBalanceDrafts((p) => ({ ...p, [u.email]: e.target.value }))
                            }
                          />
                          <button type="submit" className="admin-btn-primary admin-btn-ghost--sm">
                            Зберегти
                          </button>
                          <button
                            type="button"
                            className="admin-btn-ghost admin-btn-ghost--sm"
                            onClick={() => resetBonusDraft(u.email)}
                            title="Підставити поточний баланс зі сховища"
                          >
                            Як зараз
                          </button>
                        </div>
                        {rowErr[u.email] ? (
                          <p className="auth-form__error admin-user-bonus-form__err" role="alert">
                            {rowErr[u.email]}
                          </p>
                        ) : null}
                      </form>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-app__logout"
                        onClick={() => handleDelete(u.email)}
                      >
                        Видалити
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="admin-glass admin-product-form" style={{ marginTop: '28px' }}>
        <h2 className="admin-glass__title">Бонуси за довільною поштою</h2>
        <p className="admin-panel__note admin-panel__note--tight">
          Якщо потрібно виставити баланс для пошти, якої немає в списку зареєстрованих (наприклад,
          старі дані в сховищі).
        </p>
        <form className="admin-product-form__grid" onSubmit={handleOtherBonusSubmit}>
          <label className="admin-field admin-field--wide">
            <span>Електронна пошта</span>
            <input
              type="email"
              className="auth-field__input"
              value={otherEmail}
              onChange={(e) => setOtherEmail(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="admin-field">
            <span>Балів на рахунку</span>
            <input
              type="number"
              min={0}
              className="auth-field__input"
              value={otherBalance}
              onChange={(e) => setOtherBalance(e.target.value)}
            />
          </label>
          <div className="admin-product-form__actions">
            <button type="submit" className="admin-btn-primary">
              Зберегти баланс
            </button>
          </div>
          {otherErr ? (
            <p className="auth-form__error admin-field--wide" role="alert">
              {otherErr}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  )
}
