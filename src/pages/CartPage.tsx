/**
 * Shop31 — кошик: рядки замовлення, зміна кількості, перехід на checkout.
 * Зв’язки: ShopContext, catalog, i18n
 */
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { getShopProductById } from '../data/catalog'
import { useI18n } from '../i18n/I18nContext'
import { formatUahAmount } from '../utils/formatMoney'

export function CartPage() {
  const { t } = useI18n()
  const {
    cart,
    incrementQty,
    decrementQty,
    removeFromCart,
    clearCart,
    cartItemCount,
  } = useShop()

  const entries = Object.entries(cart)
  const lines = entries
    .map(([id, qty]) => ({ id, qty, product: getShopProductById(id) }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const subtotal = lines.reduce(
    (s, l) => s + (l.product ? l.product.priceUah * l.qty : 0),
    0,
  )

  return (
    <main className="cart-page">
      <div className="container cart-page__inner">
        <nav className="cart-page__crumb" aria-label={t('crumb.nav')}>
          <Link to="/">{t('nav.home')}</Link>
          <span className="cart-page__crumb-sep">/</span>
          <span className="cart-page__crumb-current">{t('cart.title')}</span>
        </nav>

        <div className="cart-page__head">
          <h1 className="cart-page__title">{t('cart.title')}</h1>
          {cartItemCount > 0 ? (
            <button type="button" className="cart-page__clear" onClick={() => clearCart()}>
              {t('cart.clear')}
            </button>
          ) : null}
        </div>

        {cartItemCount === 0 ? (
          <div className="cart-page__empty">
            <p>{t('cart.empty')}</p>
            <Link to="/catalog" className="cart-page__cta">
              {t('cart.toCatalog')}
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {lines.map(({ id, qty, product }) =>
                product ? (
                  <li key={id} className="cart-line">
                    <Link to={`/product/${id}`} className="cart-line__media">
                      <img src={product.image} alt="" width={96} height={96} />
                    </Link>
                    <div className="cart-line__info">
                      <Link to={`/product/${id}`} className="cart-line__name">
                        {product.name}
                      </Link>
                      {product.spec ? <p className="cart-line__spec">{product.spec}</p> : null}
                      <p className="cart-line__unit">
                        {formatUahAmount(product.priceUah)} ₴ × {qty} ={' '}
                        <strong>{formatUahAmount(product.priceUah * qty)} ₴</strong>
                      </p>
                    </div>
                    <div className="cart-line__qty" role="group" aria-label={t('cart.qtyAria')}>
                      <button
                        type="button"
                        className="cart-line__qty-btn"
                        onClick={() => decrementQty(id)}
                        aria-label={t('cart.less')}
                      >
                        −
                      </button>
                      <span className="cart-line__qty-val">{qty}</span>
                      <button
                        type="button"
                        className="cart-line__qty-btn"
                        onClick={() => incrementQty(id)}
                        aria-label={t('cart.more')}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-line__remove"
                      onClick={() => removeFromCart(id)}
                      aria-label={t('cart.removeLine')}
                    >
                      ×
                    </button>
                  </li>
                ) : (
                  <li key={id} className="cart-line cart-line--orphan">
                    <p>{t('cart.orphan', { id })}</p>
                    <button type="button" className="cart-line__remove" onClick={() => removeFromCart(id)}>
                      {t('cart.remove')}
                    </button>
                  </li>
                ),
              )}
            </ul>

            <div className="cart-summary">
              <div className="cart-summary__row">
                <span>{t('cart.summary', { count: cartItemCount })}</span>
                <strong className="cart-summary__total">
                  {formatUahAmount(subtotal)} ₴
                </strong>
              </div>
              <p className="cart-summary__hint">{t('cart.summaryHint')}</p>
              <div className="cart-summary__actions">
                <Link to="/checkout" className="cart-summary__checkout">
                  {t('cart.checkout')}
                </Link>
                <Link to="/catalog" className="cart-summary__continue">
                  {t('cart.continue')}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
