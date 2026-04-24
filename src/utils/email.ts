/**
 * Shop31 — перевірка формату email для реєстрації/входу (validator).
 * Зв’язки: RegisterPage, LoginPage, auth-логіка
 */
import validator from 'validator'

const IS_EMAIL_OPTS: validator.IsEmailOptions = {
  allow_utf8_local_part: true,
  require_tld: true,
  allow_ip_domain: false,
}

const NORMALIZE_OPTS: validator.NormalizeEmailOptions = {
  all_lowercase: true,
  gmail_remove_dots: false,
  gmail_convert_googlemaildotcom: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false,
}

/**
 * Перевіряє формат реальної пошти (не IP-домен, є TLD, дозволені UTF8-локальні частини для IDN).
 * Нормалізує регістр і службові правила (на кшталт Gmail). Лист для підтвердження скриньки без бекенду не відправляється.
 */
export function parseMailbox(
  raw: string,
): { ok: true; email: string } | { ok: false; message: string } {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, message: 'Введіть електронну пошту.' }
  }
  if (!validator.isEmail(trimmed, IS_EMAIL_OPTS)) {
    return {
      ok: false,
      message:
        'Потрібна справжня адреса електронної пошти (наприклад your.name@gmail.com, user@ukr.net, inbox@company.ua).',
    }
  }
  const normalized = validator.normalizeEmail(trimmed, NORMALIZE_OPTS)
  if (!normalized || !validator.isEmail(normalized, IS_EMAIL_OPTS)) {
    return { ok: false, message: 'Некоректна електронна пошта.' }
  }
  return { ok: true, email: normalized }
}
