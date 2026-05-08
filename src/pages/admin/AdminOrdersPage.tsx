/**
 * Shop31 — адмін: перегляд і очищення збережених замовлень (localStorage).
 * Зв’язки: ordersStorage
 */
import { useState } from 'react'
import {
  clearAllOrders,
  deleteOrder,
  readOrders,
  type SavedOrder,
} from '../../shop/ordersStorage'

function formatMoney(n: number) {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(n)
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState(readOrders)
  const [openId, setOpenId] = useState<string | null>(null)

  function refresh() {
    setOrders(readOrders())
  }

  function handleDelete(id: string) {
    if (!window.confirm(`Видалити замовлення ${id}?`)) return
    deleteOrder(id)
    if (openId === id) setOpenId(null)
    refresh()
  }

  function handleClearAll() {
    if (!window.confirm('Видалити всі збережені замовлення?')) return
    clearAllOrders()
    setOpenId(null)
    refresh()
  }

  return (
    <div className="container admin-dashboard">
      <h1 className="admin-dashboard__title">Замовлення</h1>
      <p className="admin-dashboard__lead">
        Замовлення з localStorage (оформлені через кошик на цьому пристрої).
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" className="admin-app__logout" onClick={handleClearAll}>
          Очистити всі
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="admin-panel__empty">Ще немає збережених замовлень.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }} />
                <th>Номер</th>
                <th>Дата</th>
                <th>Клієнт</th>
                <th>Сума</th>
                <th style={{ width: '120px' }}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  expanded={openId === o.id}
                  onToggle={() => setOpenId((id) => (id === o.id ? null : o.id))}
                  onDelete={() => handleDelete(o.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onDelete,
}: {
  order: SavedOrder
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <>
      <tr>
        <td>
          <button
            type="button"
            className="admin-app__logout"
            aria-expanded={expanded}
            onClick={onToggle}
            style={{ minWidth: '40px' }}
          >
            {expanded ? '−' : '+'}
          </button>
        </td>
        <td>
          <code className="admin-code">{order.id}</code>
        </td>
        <td>{new Date(order.createdAt).toLocaleString('uk-UA')}</td>
        <td>
          {order.customerName}
          <br />
          <span style={{ opacity: 0.75, fontSize: '0.9em' }}>{order.phone}</span>
        </td>
        <td>{formatMoney(order.totalUah)}</td>
        <td>
          <button type="button" className="admin-app__logout" onClick={onDelete}>
            Видалити
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={6} style={{ verticalAlign: 'top', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>Місто:</strong> {order.city || '—'}
              </p>
              <p style={{ margin: '0 0 8px' }}>
                <strong>Коментар:</strong> {order.comment || '—'}
              </p>
              {order.customerEmail ? (
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Пошта (акаунт):</strong> {order.customerEmail}
                </p>
              ) : null}
              {order.subtotalUah != null ? (
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Сума товарів:</strong> {formatMoney(order.subtotalUah)}
                </p>
              ) : null}
              {order.bonusRedeemedUah != null && order.bonusRedeemedUah > 0 ? (
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Списано бонусів:</strong> {formatMoney(order.bonusRedeemedUah)}
                </p>
              ) : null}
              {order.bonusEarnedUah != null && order.bonusEarnedUah > 0 ? (
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Нараховано бонусів:</strong> {formatMoney(order.bonusEarnedUah)}
                </p>
              ) : null}
              <p style={{ margin: '0 0 8px' }}>
                <strong>Рядки:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {order.lines.map((line, i) => (
                  <li key={`${line.productId}-${i}`}>
                    {line.name} × {line.qty} — {formatMoney(line.priceUah * line.qty)}
                  </li>
                ))}
              </ul>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}
