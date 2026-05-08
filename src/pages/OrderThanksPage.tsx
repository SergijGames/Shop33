/**
 * Shop31 — подяка після замовлення; перевірка Stripe return_url, фіналізація чернетки.
 * Зв’язки: finalizeStripeDraft, pendingStripeCheckout, ordersStorage, i18n
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { stripeApiBase } from '../config/stripeCheckout'
import { paymentApiBase } from '../config/liqpay'
import { useI18n } from '../i18n/I18nContext'
import { getOrderById } from '../shop/ordersStorage'
import { formatUahAmount } from '../utils/formatMoney'
import { tryFinalizeStripeDraft } from '../utils/finalizeStripeDraft'
import { tryFinalizeLiqpayDraft } from '../utils/finalizeLiqpayDraft'

/** Один запуск фіналізації на session_id або payment_intent (StrictMode / повторний mount). */
const inflightStripeFinalizes = new Map<string, Promise<void>>()

export function OrderThanksPage() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { clearCart } = useShop()

  const stripeSession = params.get('stripe_session')
  const paymentIntentId = params.get('payment_intent')
  const redirectStatus = params.get('redirect_status')
  const liqpayOrder = params.get('liqpay_order')

  const id = params.get('id') ?? ''

  const needsStripeFinalize = Boolean(stripeSession || paymentIntentId)

  const [stripeUi, setStripeUi] = useState<'idle' | 'loading' | 'error'>(() =>
    needsStripeFinalize ? 'loading' : 'idle',
  )
  const [stripeError, setStripeError] = useState<string | null>(null)

  const [liqpayUi, setLiqpayUi] = useState<'idle' | 'loading' | 'error'>(() =>
    liqpayOrder ? 'loading' : 'idle',
  )
  const [liqpayError, setLiqpayError] = useState<string | null>(null)

  const inflightKey = useMemo(() => {
    if (stripeSession) return `cs:${stripeSession}`
    if (paymentIntentId) return `pi:${paymentIntentId}`
    return ''
  }, [stripeSession, paymentIntentId])

  useEffect(() => {
    if (!stripeSession && !paymentIntentId) return

    if (paymentIntentId && redirectStatus === 'failed') {
      setStripeUi('error')
      setStripeError(t('thanks.bankFail'))
      return
    }

    if (!inflightKey) return

    if (inflightStripeFinalizes.has(inflightKey)) {
      setStripeUi('loading')
      return
    }

    const run = async () => {
      setStripeUi('loading')
      setStripeError(null)
      const base = stripeApiBase()

      try {
        let clientRef: string | null = null
        const paymentRef: { stripeSessionId?: string; stripePaymentIntentId?: string } = {}

        if (stripeSession) {
          const res = await fetch(
            `${base}/api/stripe/session-status?session_id=${encodeURIComponent(stripeSession)}`,
          )
          const data = (await res.json().catch(() => ({}))) as {
            error?: string
            paymentStatus?: string
            clientReferenceId?: string | null
          }
          if (!res.ok) {
            throw new Error(data.error || `${t('thanks.errPrefix')} ${res.status}`)
          }
          if (data.paymentStatus !== 'paid') {
            setStripeUi('error')
            setStripeError(t('thanks.notPaid'))
            return
          }
          clientRef = data.clientReferenceId ?? null
          paymentRef.stripeSessionId = stripeSession
        } else if (paymentIntentId) {
          const res = await fetch(
            `${base}/api/stripe/payment-intent-status?payment_intent_id=${encodeURIComponent(paymentIntentId)}`,
          )
          const data = (await res.json().catch(() => ({}))) as {
            error?: string
            status?: string
            clientReferenceId?: string | null
          }
          if (!res.ok) {
            throw new Error(data.error || `${t('thanks.errPrefix')} ${res.status}`)
          }
          if (data.status !== 'succeeded') {
            setStripeUi('error')
            setStripeError(
              data.status === 'processing' ? t('thanks.processing') : t('thanks.payIncomplete'),
            )
            return
          }
          clientRef = data.clientReferenceId ?? null
          paymentRef.stripePaymentIntentId = paymentIntentId
        }

        if (!clientRef || typeof clientRef !== 'string') {
          setStripeUi('error')
          setStripeError(t('thanks.noLink'))
          return
        }

        const result = tryFinalizeStripeDraft(clientRef, paymentRef)
        if (!result.ok) {
          setStripeUi('error')
          setStripeError(result.message)
          return
        }
        if (!result.alreadyHadOrder) {
          clearCart()
        }
        navigate(`/order-thanks?id=${encodeURIComponent(result.orderId)}`, { replace: true })
      } catch (e) {
        setStripeUi('error')
        setStripeError(e instanceof Error ? e.message : t('thanks.unknown'))
      }
    }

    const p = run()
    inflightStripeFinalizes.set(inflightKey, p)
    void p.finally(() => {
      if (inflightStripeFinalizes.get(inflightKey) === p) {
        inflightStripeFinalizes.delete(inflightKey)
      }
    })
  }, [stripeSession, paymentIntentId, redirectStatus, inflightKey, navigate, clearCart, t])

  useEffect(() => {
    if (!liqpayOrder) return
    let cancelled = false
    const run = async () => {
      setLiqpayUi('loading')
      setLiqpayError(null)
      try {
        const base = paymentApiBase()
        const res = await fetch(`${base}/api/liqpay/order-status?order_id=${encodeURIComponent(liqpayOrder)}`)
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          status?: string | null
          paymentId?: string | null
          error?: string
        }
        if (!res.ok) {
          throw new Error(data.error || `${t('thanks.errPrefix')} ${res.status}`)
        }
        const status = data.status ?? ''
        // У LiqPay paid-подібні статуси: success / sandbox / wait_accept / processing / failure / error ...
        if (status !== 'success' && status !== 'sandbox') {
          setLiqpayUi('error')
          setLiqpayError(status ? `LiqPay: ${status}` : t('thanks.notPaid'))
          return
        }
        const result = tryFinalizeLiqpayDraft(liqpayOrder, data.paymentId ?? null)
        if (!result.ok) {
          setLiqpayUi('error')
          setLiqpayError(result.message)
          return
        }
        if (!result.alreadyHadOrder) {
          clearCart()
        }
        if (!cancelled) {
          setLiqpayUi('idle')
          navigate(`/order-thanks?id=${encodeURIComponent(result.orderId)}`, { replace: true })
        }
      } catch (e) {
        setLiqpayUi('error')
        setLiqpayError(e instanceof Error ? e.message : t('thanks.unknown'))
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [liqpayOrder, navigate, clearCart, t])

  if (needsStripeFinalize && (stripeUi === 'loading' || stripeUi === 'idle')) {
    return (
      <main className="order-thanks-page">
        <div className="container order-thanks-page__inner">
          <div className="order-thanks-card">
            <h1 className="order-thanks-card__title">{t('thanks.checkPay')}</h1>
            <p className="order-thanks-card__lead">{t('thanks.wait')}</p>
          </div>
        </div>
      </main>
    )
  }

  if (liqpayOrder && (liqpayUi === 'loading' || liqpayUi === 'idle')) {
    return (
      <main className="order-thanks-page">
        <div className="container order-thanks-page__inner">
          <div className="order-thanks-card">
            <h1 className="order-thanks-card__title">{t('thanks.checkPay')}</h1>
            <p className="order-thanks-card__lead">{t('thanks.wait')}</p>
          </div>
        </div>
      </main>
    )
  }

  if (liqpayOrder && liqpayUi === 'error') {
    return (
      <main className="order-thanks-page">
        <div className="container order-thanks-page__inner">
          <div className="order-thanks-card">
            <h1 className="order-thanks-card__title">{t('thanks.failTitle')}</h1>
            <p className="order-thanks-card__lead" role="alert">
              {liqpayError ?? t('thanks.genericErr')}
            </p>
            <div className="order-thanks-card__actions">
              <Link to="/checkout" className="order-thanks-card__btn">
                {t('thanks.backCheckout')}
              </Link>
              <Link to="/" className="order-thanks-card__link">
                {t('thanks.home')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (needsStripeFinalize && stripeUi === 'error') {
    return (
      <main className="order-thanks-page">
        <div className="container order-thanks-page__inner">
          <div className="order-thanks-card">
            <h1 className="order-thanks-card__title">{t('thanks.failTitle')}</h1>
            <p className="order-thanks-card__lead" role="alert">
              {stripeError ?? t('thanks.genericErr')}
            </p>
            <div className="order-thanks-card__actions">
              <Link to="/checkout" className="order-thanks-card__btn">
                {t('thanks.backCheckout')}
              </Link>
              <Link to="/" className="order-thanks-card__link">
                {t('thanks.home')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const order = id ? getOrderById(id) : undefined

  return (
    <main className="order-thanks-page">
      <div className="container order-thanks-page__inner">
        <div className="order-thanks-card">
          <h1 className="order-thanks-card__title">{t('thanks.title')}</h1>
          {order ? (
            <>
              <p className="order-thanks-card__lead">
                {t('thanks.orderNo')}{' '}
                <strong className="order-thanks-card__id">{order.id}</strong>
              </p>
              {order.subtotalUah != null && order.bonusRedeemedUah != null && order.bonusRedeemedUah > 0 ? (
                <>
                  <p className="order-thanks-card__sum order-thanks-card__sum--muted">
                    {t('thanks.goodsSum')}{' '}
                    <strong>{formatUahAmount(order.subtotalUah)} ₴</strong>
                  </p>
                  <p className="order-thanks-card__sum order-thanks-card__sum--bonus">
                    {t('thanks.bonusDisc')}{' '}
                    <strong>−{formatUahAmount(order.bonusRedeemedUah)} ₴</strong>
                  </p>
                </>
              ) : null}
              <p className="order-thanks-card__sum">
                {t('thanks.toPay')} <strong>{formatUahAmount(order.totalUah)} ₴</strong>
              </p>
              {order.bonusEarnedUah != null && order.bonusEarnedUah > 0 ? (
                <p className="order-thanks-card__bonus-earn">
                  {t('thanks.bonusEarned')}{' '}
                  <strong>
                    +{formatUahAmount(order.bonusEarnedUah)} {t('thanks.bonusUnit')}
                  </strong>
                </p>
              ) : null}
              <p className="order-thanks-card__hint">
                {order.paymentMethod === 'stripe' ? (
                  <>
                    {t('thanks.stripeBefore')} <strong>{order.phone}</strong>
                    {t('thanks.stripeAfter')}
                  </>
                ) : (
                  <>
                    {t('thanks.contactBefore')} <strong>{order.phone}</strong>
                    {t('thanks.contactAfter')}
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="order-thanks-card__lead">{t('thanks.noId')}</p>
          )}
          <div className="order-thanks-card__actions">
            <Link to="/catalog" className="order-thanks-card__btn">
              {t('thanks.continue')}
            </Link>
            <Link to="/" className="order-thanks-card__link">
              {t('thanks.home')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
