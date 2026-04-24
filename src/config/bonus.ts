/**
 * Shop31 — константи бонусної програми (курс бал→грн, відсоток нарахування).
 * Зв’язки: bonusStorage, CheckoutPage, finalizeStripeDraft, strings (checkout)
 */
/** Скільки гривень знижки дає 1 бонусний бал (1:1). */
export const BONUS_UAH_PER_POINT = 1

/** Частка сплаченої суми (після знижки бонусами), що нараховується назад бонусами (2%). */
export const BONUS_ACCRUAL_RATE = 0.02
