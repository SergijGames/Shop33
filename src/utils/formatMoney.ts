/**
 * Shop31 — форматування сум у гривнях залежно від активної мови (locale).
 * activeLocale оновлює I18nProvider; використовується в картках і checkout.
 * Зв’язки: I18nContext.tsx, ProductGrid, Checkout*, OrderThanksPage
 */
import type { Locale } from '../i18n/types'

let activeLocale: Locale = 'uk'

/** Викликається з I18nProvider при зміні мови. */
export function setNumberFormatLocale(locale: Locale): void {
  activeLocale = locale
}

export function formatUahAmount(value: number): string {
  return value.toLocaleString(activeLocale === 'en' ? 'en-US' : 'uk-UA')
}
