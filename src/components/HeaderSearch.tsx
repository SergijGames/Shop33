/**
 * Shop31 — поле пошуку в шапці; перенаправлення на /search з query.
 * Рядки інтерфейсу через i18n.
 * Зв’язки: Layout.tsx, SearchPage.tsx, searchProducts.ts
 */
import { type FormEvent, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export function HeaderSearch() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [value, setValue] = useState('')

  useEffect(() => {
    if (location.pathname === '/search') {
      setValue(searchParams.get('q') ?? '')
    }
  }, [location.pathname, location.search, searchParams])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    const next = q
      ? `/search?q=${encodeURIComponent(q)}`
      : '/search'
    navigate(next)
  }

  return (
    <form className="search" role="search" onSubmit={onSubmit}>
      <input
        type="search"
        name="q"
        className="search__input"
        placeholder={t('search.placeholder')}
        aria-label={t('search.aria')}
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="search__btn">
        {t('search.submit')}
      </button>
    </form>
  )
}
