/**
 * Shop31 — контекст вітрини: кошик, обране, додавання товарів.
 * Читає/зберігає дані через shop/storage (localStorage).
 * Зв’язки: shop/storage.ts, data/catalog.ts, CartPage, ProductGrid, ProductPage
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import { getShopProductById } from '../data/catalog'
import { loadCart, loadFavorites, saveCart, saveFavorites } from '../shop/storage'

type ShopSnapshot = {
  favorites: readonly string[]
  cart: Readonly<Record<string, number>>
}

let snap: ShopSnapshot = {
  favorites: loadFavorites(),
  cart: loadCart(),
}

const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return snap
}

function getServerSnapshot(): ShopSnapshot {
  return { favorites: [], cart: {} }
}

function setSnap(next: ShopSnapshot) {
  snap = next
  emit()
}

type ShopContextValue = {
  favorites: readonly string[]
  cart: Readonly<Record<string, number>>
  favoriteCount: number
  cartItemCount: number
  isFavorite: (productId: string) => boolean
  toggleFavorite: (productId: string) => void
  addToCart: (productId: string, qty?: number) => void
  setCartQty: (productId: string, qty: number) => void
  incrementQty: (productId: string) => void
  decrementQty: (productId: string) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  pruneStaleFavorites: () => void
}

const ShopContext = createContext<ShopContextValue | null>(null)

export function ShopProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'shop31_favorites_v1' || e.key === 'shop31_cart_v1') {
        setSnap({
          favorites: loadFavorites(),
          cart: loadCart(),
        })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const isFavorite = useCallback(
    (productId: string) => state.favorites.includes(productId),
    [state.favorites],
  )

  const toggleFavorite = useCallback((productId: string) => {
    const has = snap.favorites.includes(productId)
    const favorites = has
      ? snap.favorites.filter((id) => id !== productId)
      : [...snap.favorites, productId]
    saveFavorites([...favorites])
    setSnap({ ...snap, favorites })
  }, [])

  const addToCart = useCallback((productId: string, qty = 1) => {
    const add = Math.max(1, Math.floor(qty))
    const prev = snap.cart[productId] ?? 0
    const nextQty = Math.min(999, prev + add)
    const cart = { ...snap.cart, [productId]: nextQty }
    saveCart(cart)
    setSnap({ ...snap, cart })
  }, [])

  const setCartQty = useCallback((productId: string, qty: number) => {
    const q = Math.floor(qty)
    const cart = { ...snap.cart }
    if (q <= 0) delete cart[productId]
    else cart[productId] = Math.min(999, q)
    saveCart(cart)
    setSnap({ ...snap, cart })
  }, [])

  const incrementQty = useCallback((productId: string) => {
    const prev = snap.cart[productId] ?? 0
    if (prev <= 0) return
    setCartQty(productId, prev + 1)
  }, [setCartQty])

  const decrementQty = useCallback((productId: string) => {
    const prev = snap.cart[productId] ?? 0
    if (prev <= 1) {
      const cart = { ...snap.cart }
      delete cart[productId]
      saveCart(cart)
      setSnap({ ...snap, cart })
    } else {
      setCartQty(productId, prev - 1)
    }
  }, [setCartQty])

  const removeFromCart = useCallback((productId: string) => {
    const cart = { ...snap.cart }
    delete cart[productId]
    saveCart(cart)
    setSnap({ ...snap, cart })
  }, [])

  const clearCart = useCallback(() => {
    saveCart({})
    setSnap({ ...snap, cart: {} })
  }, [])

  const pruneStaleFavorites = useCallback(() => {
    const next = snap.favorites.filter((id) => getShopProductById(id))
    if (next.length === snap.favorites.length) return
    saveFavorites([...next])
    setSnap({ ...snap, favorites: next })
  }, [])

  const favoriteCount = state.favorites.length
  const cartItemCount = useMemo(
    () => Object.values(state.cart).reduce((s, n) => s + n, 0),
    [state.cart],
  )

  const value = useMemo(
    () => ({
      favorites: state.favorites,
      cart: state.cart,
      favoriteCount,
      cartItemCount,
      isFavorite,
      toggleFavorite,
      addToCart,
      setCartQty,
      incrementQty,
      decrementQty,
      removeFromCart,
      clearCart,
      pruneStaleFavorites,
    }),
    [
      state.favorites,
      state.cart,
      favoriteCount,
      cartItemCount,
      isFavorite,
      toggleFavorite,
      addToCart,
      setCartQty,
      incrementQty,
      decrementQty,
      removeFromCart,
      clearCart,
      pruneStaleFavorites,
    ],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}
