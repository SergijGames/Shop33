/**
 * Shop31 — провайдер мови інтерфейсу (UK/EN), localStorage, document.lang.
 * Оновлює формат чисел через setNumberFormatLocale.
 * Зв’язки: strings.ts, types.ts, formatMoney.ts, App.tsx (обгортка)
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setNumberFormatLocale } from '../utils/formatMoney'
import { LOCALE_STORAGE_KEY, type Locale } from './types'
import { translate, type MsgKey } from './strings'

function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (raw === 'en' || raw === 'uk') return raw
  } catch {
    /* ignore */
  }
  return 'uk'
}

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  toggleLocale: () => void
  t: (key: MsgKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window !== 'undefined' ? readStoredLocale() : 'uk',
  )

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === 'uk' ? 'en' : 'uk'))
  }, [])

  useLayoutEffect(() => {
    setNumberFormatLocale(locale)
  }, [locale])

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = locale === 'uk' ? 'uk' : 'en'
  }, [locale])

  const t = useCallback(
    (key: MsgKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
