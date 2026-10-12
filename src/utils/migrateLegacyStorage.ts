/**
 * Shop33 — одноразова міграція ключів браузерного сховища після перейменування
 * проєкту (Shop31 → Shop33). Копіює `shop31_*` у `shop33_*`, якщо нового ключа ще немає,
 * щоб не втратити кошик, обране, замовлення, мову та налаштування адмінки.
 * Імпортується першим у main.tsx (до модулів, що читають сховище).
 */
const LEGACY_PREFIX = 'shop31_'
const PREFIX = 'shop33_'

function migrate(storage: Storage): void {
  const legacyKeys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key && key.startsWith(LEGACY_PREFIX)) legacyKeys.push(key)
  }
  for (const key of legacyKeys) {
    const next = PREFIX + key.slice(LEGACY_PREFIX.length)
    const value = storage.getItem(key)
    if (value !== null && storage.getItem(next) === null) storage.setItem(next, value)
    storage.removeItem(key)
  }
}

try {
  if (typeof window !== 'undefined') {
    migrate(window.localStorage)
    migrate(window.sessionStorage)
  }
} catch {
  /* сховище недоступне (приватний режим тощо) — ігноруємо */
}

export {}
