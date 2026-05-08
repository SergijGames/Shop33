/**
 * Shop31 — HTTP клієнт для бекенду (auth/admin/catalog/orders).
 * За замовчуванням використовує VITE_API_BASE_URL або VITE_PAYMENT_API_URL (якщо бекенд той самий).
 */

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/$/, '') ||
  (import.meta.env.VITE_PAYMENT_API_URL as string | undefined)?.trim().replace(/\/$/, '') ||
  ''

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
      const msg =
        json && typeof json === 'object' && json && 'error' in json && typeof (json as { error?: unknown }).error === 'string'
          ? (json as { error: string }).error
          : `HTTP ${res.status}`
      return { ok: false, error: { message: msg, status: res.status } }
    }
    return { ok: true, data: json as T }
  } catch (e) {
    return { ok: false, error: { message: e instanceof Error ? e.message : String(e) } }
  }
}

