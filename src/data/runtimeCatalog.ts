/**
 * Shop31 — runtime-джерело каталогу, яке можна підмінити даними з API.
 * Це дозволяє зберегти синхронні getShopProducts/getShopProductById, але мати реальний бекенд.
 */
import type { Product } from './products'

let runtimeProducts: Product[] | null = null

export function setRuntimeProducts(products: Product[]): void {
  runtimeProducts = products
}

export function getRuntimeProducts(): Product[] | null {
  return runtimeProducts
}

