/**
 * Shop31 — оформлення замовлення: контакти, бонуси, демо або Stripe Elements.
 * Зв’язки: ShopContext, AuthContext, bonusStorage, CheckoutStripePayment, ordersStorage
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useShop } from '../context/ShopContext'
import { BONUS_ACCRUAL_RATE } from '../config/bonus'
import { CheckoutStripePayment } from '../components/CheckoutStripePayment'
import {
  buildPaymentIntentReturnUrl,
  isStripeCheckoutEnabled,
  stripeApiBase,
  stripePublishableKey,
} from '../config/stripeCheckout'
import {
  buildLiqpayReturnUrl,
  buildLiqpayServerCallbackUrl,
  isLiqpayEnabled,
  paymentApiBase,
} from '../config/liqpay'
import { useBonusBalance } from '../hooks/useBonusBalance'
import { getShopProductById } from '../data/catalog'
import { addBonus, spendBonus } from '../shop/bonusStorage'
import { appendOrder, createOrderId, type OrderLine, type SavedOrder } from '../shop/ordersStorage'
import { notifyOrderPlaced } from '../utils/customerEmailFlow'
import { tryFinalizeStripeDraft } from '../utils/finalizeStripeDraft'
import { formatUahAmount } from '../utils/formatMoney'
import { pendingLiqpayStorageKey, type PendingLiqpayDraftV1 } from '../utils/pendingLiqpayCheckout'
import { pendingStripeStorageKey, type PendingStripeDraftV1 } from '../utils/pendingStripeCheckout'
import { useI18n } from '../i18n/I18nContext'

export function CheckoutPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cart, cartItemCount, clearCart } = useShop()
  const bonusBalance = useBonusBalance(user?.email)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [stripeBusy, setStripeBusy] = useState(false)
  const [liqpayBusy, setLiqpayBusy] = useState(false)
  const [bonusSpend, setBonusSpend] = useState(0)
  const stripeOn = isStripeCheckoutEnabled()
  const stripePk = stripePublishableKey()
  const liqpayOn = isLiqpayEnabled()
  const [embeddedStripe, setEmbeddedStripe] = useState<{
    clientSecret: string
    orderId: string
    expectedPaidUah: number
  } | null>(null)

  const lines = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = getShopProductById(id)
        if (!product || qty <= 0) return null
        return {
          productId: id,
          name: product.name,
          priceUah: product.priceUah,
          qty,
        } satisfies OrderLine
      })
      .filter((x): x is OrderLine => x != null)
      .sort((a, b) => a.productId.localeCompare(b.productId))
  }, [cart])

  const subtotalUah = useMemo(
    () => lines.reduce((s, l) => s + l.priceUah * l.qty, 0),
    [lines],
  )

  const maxBonusSpend = useMemo(() => {
    if (!user?.email) return 0
    return Math.min(bonusBalance, subtotalUah)
  }, [user?.email, bonusBalance, subtotalUah])

  useEffect(() => {
    setBonusSpend((b) => Math.min(Math.max(0, b), maxBonusSpend))
  }, [maxBonusSpend])

  const paidUah = Math.max(0, subtotalUah - bonusSpend)
  const bonusEarnedPreview = Math.floor(paidUah * BONUS_ACCRUAL_RATE)

  useEffect(() => {
    if (!embeddedStripe) return
    if (paidUah !== embeddedStripe.expectedPaidUah) {
      sessionStorage.removeItem(pendingStripeStorageKey(embeddedStripe.orderId))
      setEmbeddedStripe(null)
    }
  }, [paidUah, embeddedStripe])

  type PreparedCheckout =
    | {
        ok: true
        n: string
        ph: string
        c: string
        spend: number
        paidAfter: number
        earnAfter: number
      }
    | { ok: false; message: string }

  function prepareCheckout(): PreparedCheckout {
    const n = name.trim()
    const ph = phone.trim()
    const c = city.trim()
    if (n.length < 2) return { ok: false, message: t('val.name') }
    if (ph.length < 9) return { ok: false, message: t('val.phone') }
    if (c.length < 2) return { ok: false, message: t('val.city') }
    if (lines.length === 0) return { ok: false, message: t('val.lines') }

    const spend = Math.min(Math.max(0, Math.floor(bonusSpend)), maxBonusSpend, subtotalUah)
    const paidAfter = subtotalUah - spend
    const earnAfter = Math.floor(paidAfter * BONUS_ACCRUAL_RATE)
    return { ok: true, n, ph, c, spend, paidAfter, earnAfter }
  }

  function confirmBonusSpend(spend: number, paidAfter: number, earnAfter: number): boolean {
    if (!user?.email || spend <= 0) return true
    const left = bonusBalance - spend
    const title = t('bonus.confirmTitle', { spend })
    const body = t('bonus.confirmBody', {
      spendUah: formatUahAmount(spend),
      paid: formatUahAmount(paidAfter),
      left: formatUahAmount(Math.max(0, left)),
      earn: earnAfter,
    })
    return window.confirm(`${title}\n\n${body}`)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const p = prepareCheckout()
    if (!p.ok) {
      setError(p.message)
      return
    }

    if (!confirmBonusSpend(p.spend, p.paidAfter, p.earnAfter)) return

    setSubmitting(true)

    if (user?.email && p.spend > 0) {
      const res = spendBonus(user.email, p.spend)
      if (!res.ok) {
        setError(res.message)
        setSubmitting(false)
        return
      }
    }

    const id = createOrderId()
    const base: SavedOrder = {
      id,
      createdAt: new Date().toISOString(),
      customerName: p.n,
      phone: p.ph,
      city: p.c,
      comment: comment.trim(),
      lines,
      subtotalUah,
      totalUah: p.paidAfter,
      paymentMethod: 'demo',
    }

    if (user?.email) {
      base.customerEmail = user.email
      if (p.spend > 0) base.bonusRedeemedUah = p.spend
      if (p.earnAfter > 0) base.bonusEarnedUah = p.earnAfter
    }

    appendOrder(base)
    void notifyOrderPlaced(base)

    if (user?.email && p.earnAfter > 0) {
      addBonus(user.email, p.earnAfter)
    }

    clearCart()
    navigate(`/order-thanks?id=${encodeURIComponent(id)}`, { replace: true })
  }

  function cancelEmbeddedPayment() {
    if (embeddedStripe) {
      sessionStorage.removeItem(pendingStripeStorageKey(embeddedStripe.orderId))
    }
    setEmbeddedStripe(null)
  }

  async function handlePrepareLiqpayPayment() {
    setError(null)
    const p = prepareCheckout()
    if (!p.ok) {
      setError(p.message)
      return
    }
    if (p.paidAfter < 1) {
      setError(t('checkout.errZero'))
      return
    }
    if (!confirmBonusSpend(p.spend, p.paidAfter, p.earnAfter)) return

    const orderId = createOrderId()
    const draft: PendingLiqpayDraftV1 = {
      v: 1,
      orderId,
      customerName: p.n,
      phone: p.ph,
      city: p.c,
      comment: comment.trim(),
      lines,
      subtotalUah,
      totalUah: p.paidAfter,
      bonusSpend: user?.email ? p.spend : 0,
      bonusEarned: user?.email ? p.earnAfter : 0,
      userEmail: user?.email,
    }

    sessionStorage.setItem(pendingLiqpayStorageKey(orderId), JSON.stringify(draft))
    setLiqpayBusy(true)
    try {
      const base = paymentApiBase()
      const res = await fetch(`${base}/api/liqpay/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUah: p.paidAfter,
          orderId,
          description: 'Shop31 — замовлення',
          resultUrl: buildLiqpayReturnUrl(orderId),
          serverUrl: buildLiqpayServerCallbackUrl(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        url?: string
        data?: string
        signature?: string
      }
      if (!res.ok || !data.url || !data.data || !data.signature) {
        sessionStorage.removeItem(pendingLiqpayStorageKey(orderId))
        setError(data.error ?? `LiqPay: ${String(res.status)}`)
        return
      }

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.url
      form.acceptCharset = 'utf-8'
      form.style.display = 'none'

      const dataInp = document.createElement('input')
      dataInp.type = 'hidden'
      dataInp.name = 'data'
      dataInp.value = data.data
      form.appendChild(dataInp)

      const sigInp = document.createElement('input')
      sigInp.type = 'hidden'
      sigInp.name = 'signature'
      sigInp.value = data.signature
      form.appendChild(sigInp)

      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    } catch {
      sessionStorage.removeItem(pendingLiqpayStorageKey(orderId))
      setError(t('checkout.errNet'))
    } finally {
      setLiqpayBusy(false)
    }
  }

  async function handlePrepareCardPayment() {
    setError(null)
    if (!stripePk) {
      setError(t('checkout.errPk'))
      return
    }
    const p = prepareCheckout()
    if (!p.ok) {
      setError(p.message)
      return
    }
    if (p.paidAfter < 1) {
      setError(t('checkout.errZero'))
      return
    }
    if (!confirmBonusSpend(p.spend, p.paidAfter, p.earnAfter)) return

    const orderId = createOrderId()
    const draft: PendingStripeDraftV1 = {
      v: 1,
      orderId,
      customerName: p.n,
      phone: p.ph,
      city: p.c,
      comment: comment.trim(),
      lines,
      subtotalUah,
      totalUah: p.paidAfter,
      bonusSpend: user?.email ? p.spend : 0,
      bonusEarned: user?.email ? p.earnAfter : 0,
      userEmail: user?.email,
    }

    sessionStorage.setItem(pendingStripeStorageKey(orderId), JSON.stringify(draft))

    setStripeBusy(true)
    try {
      const base = stripeApiBase()
      const res = await fetch(`${base}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUah: p.paidAfter,
          clientReferenceId: orderId,
          customerEmail: user?.email,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        clientSecret?: string
      }
      if (!res.ok || !data.clientSecret) {
        sessionStorage.removeItem(pendingStripeStorageKey(orderId))
        setError(
          data.error ?? t('checkout.errStripe', { status: String(res.status) }),
        )
        return
      }
      setEmbeddedStripe({
        clientSecret: data.clientSecret,
        orderId,
        expectedPaidUah: p.paidAfter,
      })
    } catch {
      sessionStorage.removeItem(pendingStripeStorageKey(orderId))
      setError(t('checkout.errNet'))
    } finally {
      setStripeBusy(false)
    }
  }

  function handleEmbeddedPaid(paymentIntentId: string) {
    if (!embeddedStripe) return
    const result = tryFinalizeStripeDraft(embeddedStripe.orderId, {
      stripePaymentIntentId: paymentIntentId,
    })
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (!result.alreadyHadOrder) {
      clearCart()
    }
    setEmbeddedStripe(null)
    navigate(`/order-thanks?id=${encodeURIComponent(result.orderId)}`, { replace: true })
  }

  if (cartItemCount === 0) {
    return <Navigate to="/cart" replace />
  }

  return (
    <main className="checkout-page">
      <div className="container checkout-page__inner">
        <nav className="checkout-page__crumb" aria-label={t('crumb.nav')}>
          <Link to="/">{t('nav.home')}</Link>
          <span className="checkout-page__crumb-sep">/</span>
          <Link to="/cart">{t('nav.cart')}</Link>
          <span className="checkout-page__crumb-sep">/</span>
          <span className="checkout-page__crumb-current">{t('checkout.crumbCheckout')}</span>
        </nav>

        <h1 className="checkout-page__title">{t('checkout.title')}</h1>
        <p className="checkout-page__lead">
          {t('checkout.lead')}
          {stripeOn ? (
            <>
              {' '}
              {t('checkout.leadStripe')}
            </>
          ) : null}
        </p>

        <div className="checkout-page__grid">
          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            {error ? (
              <p className="checkout-form__error" role="alert">
                {error}
              </p>
            ) : null}

            {user?.email ? (
              <div className="checkout-bonus">
                <h2 className="checkout-bonus__title">{t('checkout.bonusTitle')}</h2>
                <p className="checkout-bonus__balance">
                  {t('checkout.bonusAvail')} <strong>{formatUahAmount(bonusBalance)}</strong>{' '}
                  {t('checkout.bonusPts')}
                </p>
                {maxBonusSpend > 0 ? (
                  <>
                    <label className="checkout-bonus__field">
                      <span className="checkout-bonus__label">
                        {t('checkout.bonusSpend', { max: formatUahAmount(maxBonusSpend) })}
                      </span>
                      <input
                        type="range"
                        className="checkout-bonus__range"
                        min={0}
                        max={maxBonusSpend}
                        step={1}
                        value={Math.min(bonusSpend, maxBonusSpend)}
                        onChange={(e) => setBonusSpend(Number(e.target.value))}
                      />
                      <div className="checkout-bonus__row">
                        <input
                          type="number"
                          className="auth-field__input checkout-bonus__number"
                          min={0}
                          max={maxBonusSpend}
                          value={bonusSpend}
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            if (Number.isFinite(v)) {
                              setBonusSpend(Math.min(Math.max(0, Math.floor(v)), maxBonusSpend))
                            }
                          }}
                        />
                        <span className="checkout-bonus__unit">{t('checkout.bonusUnit')}</span>
                      </div>
                    </label>
                    <p className="checkout-bonus__hint">{t('checkout.bonusHint')}</p>
                  </>
                ) : (
                  <p className="checkout-bonus__empty">{t('checkout.bonusEmpty')}</p>
                )}
              </div>
            ) : (
              <p className="checkout-bonus__guest">
                <Link to="/login">{t('checkout.signIn')}</Link>
                {t('checkout.bonusGuestSuffix')}
              </p>
            )}

            <label className="auth-field">
              <span className="auth-field__label">{t('checkout.name')}</span>
              <input
                className="auth-field__input"
                name="customerName"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-field__label">{t('checkout.phone')}</span>
              <input
                className="auth-field__input"
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="+380..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-field__label">{t('checkout.city')}</span>
              <input
                className="auth-field__input"
                name="city"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-field__label">{t('checkout.comment')}</span>
              <textarea
                className="checkout-form__textarea"
                name="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('checkout.commentPh')}
              />
            </label>

            <div className="checkout-form__actions">
              <button
                type="submit"
                className="checkout-form__submit"
                disabled={submitting || stripeBusy || liqpayBusy || Boolean(embeddedStripe)}
              >
                {submitting ? t('checkout.saving') : t('checkout.submitDemo')}
              </button>
              {stripeOn ? (
                <button
                  type="button"
                  className="checkout-form__submit checkout-form__submit--stripe"
                  disabled={submitting || stripeBusy || liqpayBusy || Boolean(embeddedStripe) || !stripePk}
                  onClick={() => void handlePrepareCardPayment()}
                >
                  {stripeBusy
                    ? t('checkout.stripePrep')
                    : embeddedStripe
                      ? t('checkout.stripeReady')
                      : t('checkout.stripeBtn')}
                </button>
              ) : null}
              {liqpayOn ? (
                <button
                  type="button"
                  className="checkout-form__submit checkout-form__submit--stripe"
                  disabled={submitting || stripeBusy || liqpayBusy || Boolean(embeddedStripe)}
                  onClick={() => void handlePrepareLiqpayPayment()}
                >
                  {liqpayBusy ? 'Підготовка…' : 'Оплатити LiqPay'}
                </button>
              ) : null}
              <Link to="/cart" className="checkout-form__back">
                {t('checkout.backCart')}
              </Link>
            </div>

            {stripeOn && embeddedStripe && stripePk ? (
              <div className="checkout-stripe-panel">
                <div className="checkout-stripe-panel__head">
                  <h2 className="checkout-stripe-panel__title">{t('checkout.stripeTitle')}</h2>
                  <button
                    type="button"
                    className="checkout-stripe-panel__cancel"
                    onClick={cancelEmbeddedPayment}
                  >
                    {t('checkout.stripeCancel')}
                  </button>
                </div>
                <p className="checkout-stripe-panel__hint">{t('checkout.stripeHint')}</p>
                <CheckoutStripePayment
                  publishableKey={stripePk}
                  clientSecret={embeddedStripe.clientSecret}
                  returnUrl={buildPaymentIntentReturnUrl()}
                  paidUah={paidUah}
                  onSucceeded={handleEmbeddedPaid}
                  onError={(msg) => setError(msg)}
                  disabled={submitting}
                />
              </div>
            ) : null}
          </form>

          <aside className="checkout-aside" aria-label={t('checkout.asideAria')}>
            <h2 className="checkout-aside__title">{t('checkout.asideTitle')}</h2>
            <ul className="checkout-aside__list">
              {lines.map((l) => (
                <li key={l.productId} className="checkout-aside__line">
                  <span className="checkout-aside__name">{l.name}</span>
                  <span className="checkout-aside__meta">
                    {formatUahAmount(l.priceUah)} ₴ × {l.qty}
                  </span>
                  <span className="checkout-aside__sub">
                    {formatUahAmount(l.priceUah * l.qty)} ₴
                  </span>
                </li>
              ))}
            </ul>
            <div className="checkout-aside__totals">
              <div className="checkout-aside__row">
                <span>{t('checkout.subtotal')}</span>
                <strong>{formatUahAmount(subtotalUah)} ₴</strong>
              </div>
              {user?.email && bonusSpend > 0 ? (
                <div className="checkout-aside__row checkout-aside__row--bonus">
                  <span>{t('checkout.bonusRow')}</span>
                  <strong>−{formatUahAmount(bonusSpend)} ₴</strong>
                </div>
              ) : null}
              <div className="checkout-aside__total">
                <span>{t('checkout.paid', { n: lines.reduce((s, l) => s + l.qty, 0) })}</span>
                <strong>{formatUahAmount(paidUah)} ₴</strong>
              </div>
              {user?.email ? (
                <p className="checkout-aside__bonus-note">
                  {t('checkout.bonusAfter', { b: formatUahAmount(bonusEarnedPreview) })}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
