/**
 * Shop31 — SVG-іконки для блоку профілю в акаунті (декоративні елементи UI).
 * Зв’язки: AccountPage.tsx
 */
import type { SVGProps } from 'react'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconOrders(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <path {...stroke} d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect {...stroke} x="9" y="3" width="6" height="4" rx="1" />
      <path {...stroke} d="M9 12h6M9 16h4" />
    </svg>
  )
}

export function IconHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        {...stroke}
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  )
}

export function IconCart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <circle {...stroke} cx="9" cy="21" r="1" />
      <circle {...stroke} cx="20" cy="21" r="1" />
      <path {...stroke} d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

export function IconGrid(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <rect {...stroke} x="3" y="3" width="7" height="7" rx="1" />
      <rect {...stroke} x="14" y="3" width="7" height="7" rx="1" />
      <rect {...stroke} x="3" y="14" width="7" height="7" rx="1" />
      <rect {...stroke} x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <circle {...stroke} cx="11" cy="11" r="8" />
      <path {...stroke} d="m21 21-4.35-4.35" />
    </svg>
  )
}

export function IconHome(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <path {...stroke} d="M3 9.5 12 2l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  )
}

export function IconShield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <path {...stroke} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path {...stroke} d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function IconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <path {...stroke} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path {...stroke} d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export function IconPercent(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <path {...stroke} d="M19 5 5 19" />
      <circle {...stroke} cx="6.5" cy="6.5" r="2.5" />
      <circle {...stroke} cx="17.5" cy="17.5" r="2.5" />
    </svg>
  )
}

export function IconSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <circle {...stroke} cx="12" cy="12" r="3" />
      <path
        {...stroke}
        d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      />
    </svg>
  )
}

export function IconLogout(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden {...props}>
      <path {...stroke} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline {...stroke} points="16 17 21 12 16 7" />
      <line {...stroke} x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}
