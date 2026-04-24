/**
 * Shop31 — словник перекладів інтерфейсу (UK/EN) і функція translate().
 * Ключі повідомлень споживає I18nContext та компоненти через t().
 * Зв’язки: I18nContext.tsx, types.ts (Locale, MsgKey)
 */
import type { Locale } from './types'

export const STR = {
  'top.city': { uk: 'Київ', en: 'Kyiv' },
  'top.phoneHint': { uk: 'Безкоштовно по Україні', en: 'Toll-free in Ukraine' },
  'lang.toEn': { uk: 'Перемкнути на English', en: 'Switch to English' },
  'lang.toUk': { uk: 'Перемкнути на українську', en: 'Switch to Ukrainian' },

  'nav.home': { uk: 'Головна', en: 'Home' },
  'nav.catalog': { uk: 'Каталог', en: 'Catalog' },
  'nav.admin': { uk: 'Адмін', en: 'Admin' },
  'nav.adminTitle': { uk: 'Панель адміністратора', en: 'Admin dashboard' },
  'nav.favorites': { uk: 'Обране', en: 'Favorites' },
  'nav.cart': { uk: 'Кошик', en: 'Cart' },
  'nav.navLabel': { uk: 'Кошик та акаунт', en: 'Cart and account' },

  'account.openProfile': { uk: 'відкрити профіль', en: 'open profile' },
  'account.profileAria': { uk: 'Профіль', en: 'Profile' },
  'account.logout': { uk: 'Вийти', en: 'Log out' },
  'account.guestTitle': { uk: 'Профіль', en: 'Profile' },
  'account.guestHint': { uk: 'Увійти', en: 'Sign in' },
  'account.guestAria': { uk: 'Профіль: увійти', en: 'Profile: sign in' },

  'footer.copy': { uk: '© 2026 Shop31. Неоновий досвід покупок.', en: '© 2026 Shop31. A neon shopping experience.' },
  'footer.buyers': { uk: 'Покупцям', en: 'For shoppers' },
  'footer.contacts': { uk: 'Контакти', en: 'Contact' },
  'footer.login': { uk: 'Вхід', en: 'Sign in' },
  'footer.register': { uk: 'Реєстрація', en: 'Register' },
  'footer.delivery': { uk: 'Доставка та оплата', en: 'Delivery & payment' },
  'footer.warranty': { uk: 'Гарантія', en: 'Warranty' },
  'footer.returns': { uk: 'Повернення', en: 'Returns' },

  'search.placeholder': {
    uk: 'Пошук: назва, бренд, характеристики…',
    en: 'Search: name, brand, specs…',
  },
  'search.aria': { uk: 'Пошук товарів', en: 'Product search' },
  'search.submit': { uk: 'Знайти', en: 'Search' },
  'search.title': { uk: 'Пошук товарів', en: 'Product search' },
  'search.presetsAria': { uk: 'Швидкий пошук', en: 'Quick search' },
  'search.presetsLabel': { uk: 'Швидко:', en: 'Quick:' },
  'search.meta': {
    uk: 'За запитом «{{q}}» — знайдено {{n}} {{items}}.',
    en: 'For “{{q}}” — found {{n}} {{items}}.',
  },
  'search.itemOne': { uk: 'товар', en: 'item' },
  'search.itemMany': { uk: 'товарів', en: 'items' },
  'search.emptyBefore': {
    uk: 'Нічого не знайдено. Спробуйте інші слова або',
    en: 'Nothing found. Try other words or',
  },
  'search.catalogLink': { uk: 'відкрийте каталог', en: 'open the catalog' },
  'search.emptyAfter': { uk: '.', en: '.' },
  'search.hintDefault': {
    uk: 'Введіть запит у полі пошуку в шапці та натисніть «Знайти». Кілька слів через пробіл — шукаємо товари, де є всі слова. Враховуємо схожі поняття (наприклад «телефон» і «смартфон», «ноут» і «ноутбук», «мишка» і «mouse»).',
    en: 'Type a query in the header search field and press Search. Multiple words mean we look for products that match all of them. We also match related terms (e.g. phone / smartphone, laptop / notebook, mouse).',
  },

  'home.heroAria': { uk: 'Акції', en: 'Promotions' },
  'home.eyebrow': { uk: 'Неонова розпродаж', en: 'Neon sale' },
  'home.title1': { uk: 'До −40% на електроніку', en: 'Up to −40% on electronics' },
  'home.title2': { uk: 'цього тижня', en: 'this week' },
  'home.desc': {
    uk: 'Смартфони, ноутбуки та гаджети з доставкою по Україні. Гарантія та підтримка 24/7.',
    en: 'Smartphones, laptops and gadgets with delivery across Ukraine. Warranty and 24/7 support.',
  },
  'home.cta': { uk: 'До акцій', en: 'See deals' },
  'home.cardFast': { uk: 'Швидка доставка', en: 'Fast delivery' },
  'home.cardFastSub': { uk: 'Нова пошта, Укрпошта', en: 'Nova Poshta, Ukrposhta' },
  'home.cardPay': { uk: 'Розтермінування', en: 'Installments' },
  'home.cardPaySub': { uk: 'До 12 платежів', en: 'Up to 12 payments' },
  'home.strip': {
    uk: 'Категорії з фото та фільтрація товарів — у повному каталозі.',
    en: 'Categories with photos and filters — in the full catalog.',
  },
  'home.stripLink': { uk: 'Відкрити каталог', en: 'Open catalog' },
  'home.hits': { uk: 'Хіти продажів', en: 'Bestsellers' },
  'home.more': { uk: 'Каталог →', en: 'Catalog →' },

  'catalog.photo': { uk: 'Фото:', en: 'Photo:' },
  'catalog.userTitle': { uk: 'Ваші підбірки', en: 'Your collections' },
  'catalog.userLead': {
    uk: 'Окремі каталоги, зібрані в адмін-панелі — товари в порядку, який ви задали.',
    en: 'Separate catalogs built in the admin panel — products in your chosen order.',
  },
  'catalog.collectionFallback': { uk: 'Підбірка товарів', en: 'Product collection' },
  'catalog.count0': { uk: 'немає товарів', en: 'no items' },
  'catalog.count1': { uk: '{{n}} товар', en: '{{n}} item' },
  'catalog.count2': { uk: '{{n}} товари', en: '{{n}} items' },
  'catalog.countN': { uk: '{{n}} товарів', en: '{{n}} items' },

  'catPage.crumb': { uk: 'Каталог', en: 'Catalog' },
  'catPage.chipsAria': { uk: 'Категорії каталогу', en: 'Catalog categories' },
  'catPage.back': { uk: '← До категорій', en: '← Back to categories' },
  'catPage.emptyStart': {
    uk: 'У цій підбірці поки немає товарів на вітрині. Перегляньте',
    en: 'This collection has no products on display yet. Browse',
  },
  'catPage.emptyOr': { uk: 'або', en: 'or' },
  'catPage.allProducts': { uk: 'усі товари', en: 'all products' },
  'catPage.otherCats': { uk: 'інші категорії', en: 'other categories' },

  'crumb.nav': { uk: 'Навігація', en: 'Breadcrumb' },

  'cart.title': { uk: 'Кошик', en: 'Cart' },
  'cart.clear': { uk: 'Очистити кошик', en: 'Clear cart' },
  'cart.empty': { uk: 'У кошику поки нічого немає.', en: 'Your cart is empty.' },
  'cart.toCatalog': { uk: 'Перейти до каталогу', en: 'Go to catalog' },
  'cart.qtyAria': { uk: 'Кількість', en: 'Quantity' },
  'cart.less': { uk: 'Менше', en: 'Less' },
  'cart.more': { uk: 'Більше', en: 'More' },
  'cart.removeLine': { uk: 'Прибрати з кошика', en: 'Remove from cart' },
  'cart.remove': { uk: 'Прибрати', en: 'Remove' },
  'cart.orphan': { uk: 'Товар більше недоступний (ID: {{id}})', en: 'Product no longer available (ID: {{id}})' },
  'cart.summary': { uk: 'Разом ({{count}} шт.)', en: 'Total ({{count}} pc.)' },
  'cart.summaryHint': {
    uk: 'Натисніть «Оформити замовлення», щоб ввести контакти та підтвердити кошик.',
    en: 'Press “Place order” to enter contacts and confirm your cart.',
  },
  'cart.checkout': { uk: 'Оформити замовлення', en: 'Place order' },
  'cart.continue': { uk: 'Продовжити покупки', en: 'Continue shopping' },

  'checkout.title': { uk: 'Оформлення замовлення', en: 'Checkout' },
  'checkout.crumbCheckout': { uk: 'Оформлення', en: 'Checkout' },
  'checkout.lead': {
    uk: 'Демо: замовлення та бонуси зберігаються лише в браузері. 1 бонусний бал = 1 грн знижки; після оплати нараховується ~2% бонусами від суми до сплати.',
    en: 'Demo: orders and bonuses are stored only in your browser. 1 bonus point = 1 UAH off; after payment ~2% bonus is earned on the amount paid.',
  },
  'checkout.leadStripe': {
    uk: 'Оплата карткою на цій сторінці — Stripe Elements. Потрібні npm run dev + npm run dev:payment, STRIPE_SECRET_KEY у server/.env та VITE_STRIPE_PUBLISHABLE_KEY у кореневому .env.',
    en: 'Card payment on this page — Stripe Elements. You need npm run dev + npm run dev:payment, STRIPE_SECRET_KEY in server/.env and VITE_STRIPE_PUBLISHABLE_KEY in the root .env.',
  },
  'checkout.bonusTitle': { uk: 'Бонусний рахунок', en: 'Bonus balance' },
  'checkout.bonusAvail': { uk: 'Доступно:', en: 'Available:' },
  'checkout.bonusPts': { uk: 'б.', en: 'pts' },
  'checkout.bonusSpend': {
    uk: 'Списати бонуси на це замовлення (до {{max}} б.)',
    en: 'Redeem bonuses on this order (up to {{max}} pts)',
  },
  'checkout.bonusUnit': { uk: 'балів', en: 'points' },
  'checkout.bonusHint': {
    uk: 'Підтвердження з’явиться перед відправленням замовлення: бали знімаються лише після вашої згоди.',
    en: 'You will be asked to confirm before placing the order; points are deducted only after you agree.',
  },
  'checkout.bonusEmpty': {
    uk: 'Немає бонусів для списання або сума кошика 0.',
    en: 'No bonuses to redeem or cart total is 0.',
  },
  'checkout.bonusGuestSuffix': {
    uk: ', щоб накопичувати та списувати бонусні бали.',
    en: ' to earn and redeem bonus points.',
  },
  'checkout.signIn': { uk: 'Увійдіть', en: 'Sign in' },
  'checkout.name': { uk: 'Ім’я та прізвище', en: 'Full name' },
  'checkout.phone': { uk: 'Телефон', en: 'Phone' },
  'checkout.city': { uk: 'Місто / відділення НП', en: 'City / parcel locker (NP)' },
  'checkout.comment': { uk: 'Коментар до замовлення', en: 'Order note' },
  'checkout.commentPh': { uk: 'Необов’язково', en: 'Optional' },
  'checkout.submitDemo': { uk: 'Підтвердити замовлення', en: 'Confirm order' },
  'checkout.saving': { uk: 'Збереження…', en: 'Saving…' },
  'checkout.stripePrep': { uk: 'Підготовка форми оплати…', en: 'Preparing payment…' },
  'checkout.stripeReady': { uk: 'Форма оплати нижче', en: 'Payment form below' },
  'checkout.stripeBtn': { uk: 'Оплатити карткою на сайті', en: 'Pay by card on site' },
  'checkout.backCart': { uk: '← Назад до кошика', en: '← Back to cart' },
  'checkout.asideAria': { uk: 'Ваше замовлення', en: 'Your order' },
  'checkout.asideTitle': { uk: 'Склад замовлення', en: 'Order contents' },
  'checkout.subtotal': { uk: 'Товарів на суму', en: 'Subtotal' },
  'checkout.bonusRow': { uk: 'Бонусна знижка', en: 'Bonus discount' },
  'checkout.paid': { uk: 'До сплати ({{n}} шт.)', en: 'To pay ({{n}} pc.)' },
  'checkout.bonusAfter': {
    uk: '+{{b}} б. після замовлення (~2%)',
    en: '+{{b}} pts after order (~2%)',
  },
  'checkout.stripeTitle': { uk: 'Оплата карткою', en: 'Card payment' },
  'checkout.stripeCancel': { uk: 'Скасувати', en: 'Cancel' },
  'checkout.stripeHint': {
    uk: 'Дані картки обробляє Stripe; магазин не зберігає номер картки.',
    en: 'Card data is handled by Stripe; the store never stores your card number.',
  },
  'checkout.errPk': {
    uk: 'Додайте VITE_STRIPE_PUBLISHABLE_KEY (pk_test_...) у файл .env у корені проєкту.',
    en: 'Add VITE_STRIPE_PUBLISHABLE_KEY (pk_test_...) to the root .env file.',
  },
  'checkout.errZero': {
    uk: 'Сума до сплати 0 ₴ — оформіть замовлення кнопкою «Підтвердити замовлення».',
    en: 'Amount due is 0 UAH — use “Confirm order” instead.',
  },
  'checkout.errStripe': {
    uk: 'Помилка {{status}}. Запустіть сервер оплати (npm run dev:payment) і перевірте ключі Stripe.',
    en: 'Error {{status}}. Run the payment server (npm run dev:payment) and check Stripe keys.',
  },
  'checkout.errNet': {
    uk: 'Не вдалося з’єднатися з сервером оплати.',
    en: 'Could not reach the payment server.',
  },

  'thanks.checkPay': { uk: 'Перевіряємо оплату…', en: 'Verifying payment…' },
  'thanks.wait': {
    uk: 'Зачекайте, завершуємо оформлення замовлення.',
    en: 'Please wait while we finish your order.',
  },
  'thanks.failTitle': { uk: 'Не вдалося завершити замовлення', en: 'Could not complete order' },
  'thanks.genericErr': { uk: 'Сталася помилка.', en: 'Something went wrong.' },
  'thanks.backCheckout': { uk: 'Повернутися до оформлення', en: 'Back to checkout' },
  'thanks.home': { uk: 'На головну', en: 'Home' },
  'thanks.title': { uk: 'Дякуємо за замовлення!', en: 'Thank you for your order!' },
  'thanks.orderNo': { uk: 'Номер замовлення:', en: 'Order number:' },
  'thanks.goodsSum': { uk: 'Товарів на суму:', en: 'Goods total:' },
  'thanks.bonusDisc': { uk: 'Бонусна знижка:', en: 'Bonus discount:' },
  'thanks.toPay': { uk: 'До сплати:', en: 'Amount paid:' },
  'thanks.bonusEarned': { uk: 'На бонусний рахунок нараховано:', en: 'Bonus credited:' },
  'thanks.bonusUnit': { uk: 'б.', en: 'pts' },
  'thanks.stripeBefore': {
    uk: 'Оплата карткою підтверджена. Ми зв’яжемося з вами за номером',
    en: 'Card payment confirmed. We will contact you at',
  },
  'thanks.stripeAfter': {
    uk: '. Дані замовлення збережено лише у вашому браузері (демо).',
    en: '. Order data is stored only in your browser (demo).',
  },
  'thanks.demoBefore': {
    uk: 'Ми зв’яжемося з вами за номером',
    en: 'We will contact you at',
  },
  'thanks.demoAfter': {
    uk: ' для уточнення деталей (у демо-режимі дані лише у вашому браузері).',
    en: ' for details (demo: data stays in your browser only).',
  },
  'thanks.noId': {
    uk: 'Замовлення прийнято. Якщо ви не бачите номера — відкрийте сторінку з посилання після оформлення ще раз.',
    en: 'Order received. If you do not see the number, open the link from checkout again.',
  },
  'thanks.continue': { uk: 'Продовжити покупки', en: 'Continue shopping' },
  'thanks.bankFail': {
    uk: 'Банк відхилив або скасував перевірку картки.',
    en: 'The bank declined or cancelled card verification.',
  },
  'thanks.notPaid': {
    uk: 'Оплата ще не підтверджена або скасована.',
    en: 'Payment is not confirmed or was cancelled.',
  },
  'thanks.processing': {
    uk: 'Платіж ще обробляється. Оновіть сторінку через хвилину.',
    en: 'Payment is still processing. Refresh the page in a minute.',
  },
  'thanks.payIncomplete': {
    uk: 'Оплата не завершена або скасована.',
    en: 'Payment was not completed or was cancelled.',
  },
  'thanks.noLink': {
    uk: 'Немає прив’язки замовлення до оплати.',
    en: 'Order could not be linked to this payment.',
  },
  'thanks.unknown': { uk: 'Невідома помилка', en: 'Unknown error' },
  'thanks.errPrefix': { uk: 'Помилка', en: 'Error' },

  'login.title': { uk: 'Вхід', en: 'Sign in' },
  'login.lead': {
    uk: 'Увійдіть з тією ж електронною поштою, що й при реєстрації (перевіряється формат справжньої адреси).',
    en: 'Use the same email as when you registered (we validate a real address format).',
  },
  'login.email': { uk: 'Електронна пошта', en: 'Email' },
  'login.emailHint': {
    uk: 'Повна адреса з коректним доменом (наприклад @gmail.com).',
    en: 'Full address with a valid domain (e.g. @gmail.com).',
  },
  'login.password': { uk: 'Пароль', en: 'Password' },
  'login.submit': { uk: 'Увійти', en: 'Sign in' },
  'login.switch': { uk: 'Немає акаунту?', en: 'No account?' },
  'login.register': { uk: 'Зареєструватись', en: 'Register' },

  'reg.title': { uk: 'Реєстрація', en: 'Register' },
  'reg.lead': {
    uk: 'Створіть акаунт Shop31. Після реєстрації на пошту може автоматично надійти лист-подяка (через EmailJS — див. .env.example).',
    en: 'Create a Shop31 account. After signup you may get a thank-you email (EmailJS — see .env.example).',
  },
  'reg.name': { uk: 'Ім’я', en: 'Name' },
  'reg.email': { uk: 'Електронна пошта', en: 'Email' },
  'reg.emailHint': {
    uk: 'Лише дійсні домени з TLD (не підходять вигадані адреси на кшталт user@local).',
    en: 'Only real domains with a TLD (fictional addresses like user@local are not accepted).',
  },
  'reg.password': { uk: 'Пароль', en: 'Password' },
  'reg.passwordHint': { uk: 'Мінімум 8 символів', en: 'At least 8 characters' },
  'reg.password2': { uk: 'Підтвердження пароля', en: 'Confirm password' },
  'reg.submit': { uk: 'Зареєструватись', en: 'Register' },
  'reg.wait': { uk: 'Зачекайте…', en: 'Please wait…' },
  'reg.switch': { uk: 'Вже маєте акаунт?', en: 'Already have an account?' },
  'reg.signIn': { uk: 'Увійти', en: 'Sign in' },
  'reg.errMismatch': { uk: 'Паролі не збігаються.', en: 'Passwords do not match.' },
  'reg.flashOk': {
    uk: 'На вашу електронну пошту надіслано лист-подяку за реєстрацію. Якщо листа немає — перевірте «Спам» і папку «Промоакції».',
    en: 'A thank-you email was sent to your address. If you do not see it, check Spam and Promotions.',
  },
  'reg.flashNotConfigured': {
    uk: 'Акаунт створено. Лист не надсилається: не налаштовано EmailJS. У корені проєкту створіть .env (зразок — .env.example), заповніть VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID і VITE_EMAILJS_TEMPLATE_ID, потім перезапустіть dev-сервер або зробіть npm run build (для статичного сайту ключі мають потрапити в збірку).',
    en: 'Account created. Email is not sent: EmailJS is not configured. Create .env in the project root (see .env.example), set VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID and VITE_EMAILJS_TEMPLATE_ID, then restart dev or run npm run build so keys are in the bundle.',
  },
  'reg.flashErr': {
    uk: 'Акаунт створено, але лист не надіслано. Помилка сервісу: {{hint}}. У шаблоні EmailJS поле «To» має бути {{user_email}}; перевірте логи на emailjs.com. Деталі — F12 → Console.',
    en: 'Account created but the email was not sent. Service error: {{hint}}. In the EmailJS template the To field should be {{user_email}}; check logs on emailjs.com. Details: F12 → Console.',
  },

  'fav.title': { uk: 'Обране', en: 'Favorites' },
  'fav.meta0': { uk: 'Немає збережених товарів.', en: 'No saved products.' },
  'fav.meta1': { uk: '1 товар', en: '1 item' },
  'fav.metaN': { uk: '{{n}} товарів', en: '{{n}} items' },
  'fav.stale1': { uk: 'позиція більше не в каталозі.', en: 'item is no longer in the catalog.' },
  'fav.staleN': { uk: 'позицій більше не в каталозі.', en: 'items are no longer in the catalog.' },
  'fav.prune': { uk: 'Прибрати зі списку', en: 'Remove from list' },
  'fav.empty': {
    uk: 'Натисніть ♡ на картці товару або на сторінці товару, щоб додати сюди.',
    en: 'Click ♡ on a product card or product page to add it here.',
  },
  'fav.cta': { uk: 'До каталогу', en: 'To catalog' },
  'fav.addCart': { uk: 'У кошик', en: 'Add to cart' },
  'fav.remove': { uk: 'Прибрати', en: 'Remove' },
  'fav.unfavAria': { uk: 'Прибрати з обраного', en: 'Remove from favorites' },

  'account.role': { uk: 'Адміністратор', en: 'Administrator' },
  'account.promosAria': { uk: 'Пропозиції', en: 'Offers' },
  'account.clubTitle': { uk: 'Клуб Shop31', en: 'Shop31 Club' },
  'account.clubSub': {
    uk: 'Персональні знижки та неонові бонуси',
    en: 'Personal discounts and neon bonuses',
  },
  'account.searchTitle': { uk: 'Швидкий пошук', en: 'Quick search' },
  'account.searchSub': {
    uk: 'Знаходьте товари та підбірки за секунди',
    en: 'Find products and collections in seconds',
  },
  'account.bonusTitle': { uk: 'Бонусний рахунок', en: 'Bonus balance' },
  'account.bonusBal': { uk: 'балів', en: 'points' },
  'account.bonusEq': { uk: '· 1 б. = 1 грн знижки', en: '· 1 pt = 1 UAH off' },
  'account.bonusDesc': {
    uk: 'Після кожної покупки нараховується ~2% від сплаченої суми. На оформленні замовлення можна зменшити суму бонусами — лише після вашого підтвердження в діалозі.',
    en: 'After each purchase ~2% of the paid amount is credited. At checkout you can redeem bonuses — only after you confirm in the dialog.',
  },
  'account.bonusAdminTitle': { uk: 'Редагування балів', en: 'Edit points' },
  'account.bonusAdminHint': {
    uk: 'Баланс поточного акаунту (адміна). Щоб змінити бонуси покупців, відкрийте розділ «Користувачі» в адмін-панелі. Демо, лише в цьому браузері.',
    en: 'Current account (admin) balance. To change customer bonuses, open Users in the admin panel. Demo, this browser only.',
  },
  'account.bonusPh': { uk: 'Балів на рахунку', en: 'Points on account' },
  'account.save': { uk: 'Зберегти', en: 'Save' },
  'account.bonusErr': {
    uk: 'Вкажіть невід’ємне ціле число балів.',
    en: 'Enter a non-negative whole number of points.',
  },
  'account.menuAria': { uk: 'Меню профілю', en: 'Profile menu' },
  'account.orders': { uk: 'Мої замовлення', en: 'My orders' },
  'account.favorites': { uk: 'Обране', en: 'Favorites' },
  'account.cart': { uk: 'Кошик', en: 'Cart' },
  'account.catalog': { uk: 'Каталог', en: 'Catalog' },
  'account.searchNav': { uk: 'Пошук', en: 'Search' },
  'account.home': { uk: 'Головна', en: 'Home' },
  'account.deals': { uk: 'Акції та знижки', en: 'Deals & discounts' },
  'account.checkout': { uk: 'Оформити замовлення', en: 'Checkout' },
  'account.adminPanel': { uk: 'Панель адміністратора', en: 'Admin dashboard' },
  'account.details': { uk: 'Відомості', en: 'Details' },
  'account.emailLbl': { uk: 'Пошта', en: 'Email' },
  'account.demoNote': {
    uk: 'Демо-профіль: дані лише в цьому браузері.',
    en: 'Demo profile: data only in this browser.',
  },
  'account.logoutFull': { uk: 'Вийти з акаунту', en: 'Log out' },

  'orders.back': { uk: '‹ Профіль', en: '‹ Profile' },
  'orders.title': { uk: 'Мої замовлення', en: 'My orders' },
  'orders.lead': {
    uk: 'Збережені в цьому браузері (демо). Деталі замовлення — у підсумку після оформлення.',
    en: 'Stored in this browser (demo). Order details are in the summary after checkout.',
  },
  'orders.empty': {
    uk: 'Ще немає замовлень. Перейдіть у кошик і оформіть покупку.',
    en: 'No orders yet. Go to your cart and place an order.',
  },
  'orders.pos': { uk: 'поз.', en: 'lines' },

  'product.crumbAria': { uk: 'Шлях до товару', en: 'Breadcrumb' },
  'product.photo': { uk: 'Фото {{n}}', en: 'Photo {{n}}' },
  'product.tabsAria': { uk: 'Розділи товару', en: 'Product sections' },
  'product.tabAbout': { uk: 'Опис', en: 'Overview' },
  'product.tabVideo': { uk: 'Відео', en: 'Video' },
  'product.tabSpecs': { uk: 'Характеристики', en: 'Specs' },
  'product.tabReviews': { uk: 'Відгуки', en: 'Reviews' },
  'product.rev1': { uk: 'відгук', en: 'review' },
  'product.revN': { uk: 'відгуків', en: 'reviews' },
  'product.noRevYet': {
    uk: 'Ще немає відгуків — залиште перший у вкладці «Відгуки».',
    en: 'No reviews yet — leave the first one in the Reviews tab.',
  },
  'product.buy': { uk: 'Купити', en: 'Buy' },
  'product.favOn': { uk: '♥ У обраному', en: '♥ In favorites' },
  'product.favOff': { uk: '♡ В обране', en: '♡ Add to favorites' },
  'product.cartHint': {
    uk: 'Товар додано до кошика.',
    en: 'Added to cart.',
  },
  'product.toCart': { uk: 'Перейти до кошика', en: 'Go to cart' },
  'product.aboutTitle': { uk: 'Про товар', en: 'About' },
  'product.videoTitle': { uk: 'Відео', en: 'Video' },
  'product.videoEmpty': {
    uk: 'Для цього товару ще не додані вбудовані ролики. Якщо маєш посилання на YouTube — надішли їх, і ми підставимо їх у каталог (потрібен лише ID після watch?v= або коротке посилання youtu.be/…).',
    en: 'No embedded videos for this product yet. If you have YouTube links, send them and we will add them (only the ID after watch?v= or a youtu.be/… short link).',
  },
  'product.specsTitle': { uk: 'Характеристики', en: 'Specifications' },
  'product.revTitle': { uk: 'Відгуки покупців', en: 'Customer reviews' },
  'product.revEmpty': {
    uk: 'Поки немає відгуків. Можете залишити перший — він збережеться в цьому браузері (демо без сервера).',
    en: 'No reviews yet. You can leave the first — it is saved in this browser (demo, no server).',
  },
  'product.revFormTitle': { uk: 'Залишити відгук', en: 'Write a review' },
  'product.revName': { uk: 'Ім’я або нік', en: 'Name or nickname' },
  'product.revNamePh': { uk: 'Наприклад, Олена', en: 'e.g. Jane' },
  'product.revRating': { uk: 'Оцінка', en: 'Rating' },
  'product.revStar': { uk: '{{n}} з 5 зірок', en: '{{n}} of 5 stars' },
  'product.revText': { uk: 'Коментар', en: 'Comment' },
  'product.revTextPh': {
    uk: 'Розкажіть про досвід використання…',
    en: 'Tell us about your experience…',
  },
  'product.revThanks': { uk: 'Дякуємо! Відгук збережено.', en: 'Thanks! Review saved.' },
  'product.revSubmit': { uk: 'Надіслати відгук', en: 'Submit review' },
  'stripe.confirmErr': {
    uk: 'Не вдалося підтвердити оплату.',
    en: 'Could not confirm payment.',
  },

  'grid.rev1': { uk: 'відгук', en: 'review' },
  'grid.revN': { uk: 'відгуків', en: 'reviews' },
  'grid.noRev': { uk: 'Ще без відгуків', en: 'No reviews yet' },
  'grid.buy': { uk: 'Купити', en: 'Buy' },
  'grid.favRemove': { uk: 'Прибрати з обраного', en: 'Remove from favorites' },
  'grid.favAdd': { uk: 'Додати в обране', en: 'Add to favorites' },

  'stripe.processing': { uk: 'Обробка…', en: 'Processing…' },
  'stripe.pay': { uk: 'Сплатити {{amount}} ₴', en: 'Pay {{amount}} ₴' },

  'bonus.confirmTitle': { uk: 'Погоджуєтесь списати {{spend}} бонусних балів?', en: 'Redeem {{spend}} bonus points?' },
  'bonus.confirmBody': {
    uk: 'Сума замовлення зменшиться на {{spendUah}} грн.\nДо сплати: {{paid}} грн.\nЗалишок бонусів після списання: {{left}} б.\n\nБонуси знімуться після успішної оплати карткою або одразу при демо-оформленні.\nПісля замовлення нарахуємо близько {{earn}} б. (2% від сплаченої суми).',
    en: 'Order total drops by {{spendUah}} UAH.\nAmount due: {{paid}} UAH.\nBonus balance after redeem: {{left}} pts.\n\nPoints are taken after successful card payment or immediately on demo checkout.\nAfter the order you will earn about {{earn}} pts (2% of amount paid).',
  },

  'val.name': { uk: 'Вкажіть ім’я (мінімум 2 символи).', en: 'Enter a name (at least 2 characters).' },
  'val.phone': { uk: 'Вкажіть коректний номер телефону.', en: 'Enter a valid phone number.' },
  'val.city': { uk: 'Вкажіть місто доставки.', en: 'Enter a delivery city.' },
  'val.lines': { uk: 'У кошику немає доступних товарів.', en: 'No available items in the cart.' },
} as const

export type MsgKey = keyof typeof STR

export function translate(
  locale: Locale,
  key: MsgKey,
  vars?: Record<string, string | number>,
): string {
  let s: string = STR[key][locale]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{{${k}}}`, String(v))
    }
  }
  return s
}
