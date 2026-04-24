/**
 * Shop31 — Stripe Payment Element (оплата карткою на сторінці checkout).
 * Обгортає @stripe/react-stripe-js Elements; тексти кнопок через i18n.
 * Зв’язки: CheckoutPage.tsx, server/index.mjs
 */
import { useMemo, useState, type FormEvent } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useI18n } from '../i18n/I18nContext'
import { formatUahAmount } from '../utils/formatMoney'

type InnerProps = {
  returnUrl: string
  paidUah: number
  onSucceeded: (paymentIntentId: string) => void
  onError: (message: string) => void
  disabled?: boolean
}

function StripePaymentForm({
  returnUrl,
  paidUah,
  onSucceeded,
  onError,
  disabled,
}: InnerProps) {
  const { t } = useI18n()
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || disabled) return
    setBusy(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    })
    setBusy(false)
    if (error) {
      onError(error.message ?? t('stripe.confirmErr'))
      return
    }
    if (paymentIntent?.status === 'succeeded' && paymentIntent.id) {
      onSucceeded(paymentIntent.id)
    }
  }

  return (
    <form className="checkout-stripe-form" onSubmit={(ev) => void handleSubmit(ev)}>
      <div className="checkout-stripe-form__element">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button
        type="submit"
        className="checkout-form__submit checkout-form__submit--stripe"
        disabled={!stripe || busy || disabled}
      >
        {busy ? t('stripe.processing') : t('stripe.pay', { amount: formatUahAmount(paidUah) })}
      </button>
    </form>
  )
}

type Props = InnerProps & {
  publishableKey: string
  clientSecret: string
}

export function CheckoutStripePayment({ publishableKey, clientSecret, ...inner }: Props) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])

  return (
    <Elements
      key={clientSecret}
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#ff2db8',
            colorBackground: '#12131f',
            colorText: '#f0f0f5',
            borderRadius: '10px',
          },
        },
      }}
    >
      <StripePaymentForm {...inner} />
    </Elements>
  )
}
