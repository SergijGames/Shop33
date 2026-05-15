/**
 * Shop31 — HTTP клієнт для бекенду (auth/admin/catalog/orders).
 * За замовчуванням використовує VITE_API_BASE_URL або VITE_PAYMENT_API_URL (якщо бекенд той самий).
 */

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/$/, '') ||
  (import.meta.env.VITE_PAYMENT_API_URL as string | undefined)?.trim().replace(/\/$/, '') ||
  ''

/** Чи задано URL бекенду під час збірки (GitHub Secret VITE_API_BASE_URL). */
export function hasApiBase(): boolean {
  return API_BASE.length > 0
}

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`
  return `${API_BASE}${path}`
}

export type ApiError = { message: string; status?: number }

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string | null },
): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  try {
    const headers = new Headers(init?.headers)
    if (!headers.has('Content-Type') && init?.body) {
      headers.set('Content-Type', 'application/json')
    }
    if (init?.token) {
      headers.set('Authorization', `Bearer ${init.token}`)
    }
    const res = await fetch(apiUrl(path), { ...init, headers })
    const json = (await res.json().catch(() => null)) as unknown
    if (!res.ok) {
      let msg =
        json && typeof json === 'object' && json && 'error' in json && typeof (json as { error?: unknown }).error === 'string'
          ? (json as { error: string }).error
          : `HTTP ${res.status}`
      if (!hasApiBase() && (res.status === 405 || res.status === 404)) {
        msg =
          'API не підключено. На GitHub Pages потрібен окремий сервер (Render) і секрет VITE_API_BASE_URL. Див. підказку нижче на сторінці.'
      } else if (res.status === 405) {
        msg = 'Сервер відхилив запит (405). Перевірте VITE_API_BASE_URL — має вказувати на Node API, не на github.io.'
      }
      return { ok: false, error: { message: msg, status: res.status } }
    }
    return { ok: true, data: json as T }
  } catch (e) {
    return { ok: false, error: { message: e instanceof Error ? e.message : String(e) } }
  }
}

