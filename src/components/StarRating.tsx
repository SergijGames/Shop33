/**
 * Shop31 — відображення рейтингу зірками (доступність, стилізація через className).
 * Зв’язки: ProductGrid, ProductPage, відгуки
 */
type Props = {
  value: number
  /** Клас контейнера зірок (наприклад `product-page__stars` або `product-card__stars`). */
  className?: string
}

export function StarRating({ value, className = 'product-page__stars' }: Props) {
  const full = Math.round(Math.min(5, Math.max(0, value)))
  return (
    <span className={className} aria-label={`Оцінка ${value.toFixed(1)} з 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? 'is-on' : ''} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}
