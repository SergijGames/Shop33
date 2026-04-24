/**
 * Shop31 — статичний каталог товарів (описи, ціни, зображення, відгуки за замовчуванням).
 * Зв’язки: data/catalog.ts, ProductPage, ProductGrid, admin-редагування
 */
import ipOrange1 from '../assets/products/iphone-17-cosmic-orange/01.png'
import ipOrange2 from '../assets/products/iphone-17-cosmic-orange/02.png'
import ipOrange3 from '../assets/products/iphone-17-cosmic-orange/03.png'
import ipOrange4 from '../assets/products/iphone-17-cosmic-orange/04.png'
import ipOrange5 from '../assets/products/iphone-17-cosmic-orange/05.png'
import ipOrange6 from '../assets/products/iphone-17-cosmic-orange/06.png'
import ipOrange7 from '../assets/products/iphone-17-cosmic-orange/07.png'
import ipOrange8 from '../assets/products/iphone-17-cosmic-orange/08.png'
import ipOrange9 from '../assets/products/iphone-17-cosmic-orange/09.png'
import ipOrange10 from '../assets/products/iphone-17-cosmic-orange/10.png'
import smViolet1 from '../assets/products/samsung-s26-new/01.png'
import smViolet2 from '../assets/products/samsung-s26-new/02.png'
import smViolet3 from '../assets/products/samsung-s26-new/03.png'
import smViolet4 from '../assets/products/samsung-s26-new/04.png'
import smViolet5 from '../assets/products/samsung-s26-new/05.png'
import smViolet6 from '../assets/products/samsung-s26-new/06.png'
import smViolet7 from '../assets/products/samsung-s26-new/07.png'
import smViolet8 from '../assets/products/samsung-s26-new/08.png'
import imgLaptop from '../assets/products/laptop.png'
import imgEarbuds from '../assets/products/earbuds.png'
import imgMouse from '../assets/products/mouse.png'
import imgVacuum from '../assets/products/vacuum.png'
import imgTablet from '../assets/products/tablet.png'
import imgPartySpeaker from '../assets/products/party-speaker.png'
import type { ShopCategoryId } from './shopCategories'

export type ProductVideo = { title: string; youtubeId: string }

export type ProductReview = {
  author: string
  rating: number
  date: string
  text: string
}

export type Product = {
  id: string
  name: string
  spec?: string
  priceUah: number
  oldPriceUah: number | null
  tag: string
  image: string
  categoryId: ShopCategoryId
  description: string
  /** Головне + додаткові кадри (локальні або URL) */
  gallery: string[]
  videos: ProductVideo[]
  specsTable: { label: string; value: string }[]
  reviews: ProductReview[]
}

const sharedPhoneReviewVideo: ProductVideo[] = [
  { title: 'Відеоогляд', youtubeId: 'sy04A4SxTY0' },
]

/** Офіційні ролики Apple для сторінки товару iPhone 17 Pro. */
const iphone17ProCosmicOrangeVideos: ProductVideo[] = [
  { title: 'Introducing iPhone 17 Pro | Apple', youtubeId: '_-AS5DtDeqs' },
  { title: 'Apple Event — вересень (повна презентація)', youtubeId: 'H3KnMyojEQU' },
]

export const products: Product[] = [
  {
    id: 'samsung-galaxy-s26',
    name: 'Мобільний телефон Samsung Galaxy S26 12/512GB Cobalt Violet (SM-S942BZVHEUC)',
    spec: '12/512 ГБ · Cobalt Violet · SM-S942BZVHEUC',
    priceUah: 44_999,
    oldPriceUah: 47_999,
    tag: 'Хіт',
    image: smViolet1,
    categoryId: 'smarfony',
    description:
      'Samsung Galaxy S26 у кольорі Cobalt Violet — флагман із великим AMOLED-дисплеєм, індивідуальними модулями камер на задній панелі та потужною начинкою. 12 ГБ оперативної пам’яті та 512 ГБ вбудованого сховища, захист IP68 і екосистема Galaxy.',
    gallery: [
      smViolet1,
      smViolet2,
      smViolet3,
      smViolet4,
      smViolet5,
      smViolet6,
      smViolet7,
      smViolet8,
    ],
    videos: sharedPhoneReviewVideo,
    specsTable: [
      { label: 'Артикул', value: 'SM-S942BZVHEUC' },
      { label: 'Колір', value: 'Cobalt Violet (кобальт фіолетовий)' },
      { label: 'Пам’ять', value: '12 ГБ RAM / 512 ГБ' },
      { label: 'Дисплей', value: 'Dynamic AMOLED 2X, адаптивна частота' },
      { label: 'Камера', value: 'Тройна основна + фронтальна' },
      { label: 'Захист', value: 'IP68' },
      { label: 'Порт', value: 'USB-C' },
      { label: 'ОС', value: 'Android з One UI' },
    ],
    reviews: [
      {
        author: 'Олег С.',
        rating: 5,
        date: '2026-03-01',
        text: 'Екран просто космос, камера вночі тягне як dslr. One UI звична.',
      },
      {
        author: 'Ksu',
        rating: 5,
        date: '2026-02-20',
        text: 'Брав на заміну S23 — автономія помітно краща.',
      },
    ],
  },
  {
    id: 'iphone-17-pro-256-cosmic-orange',
    name: 'Мобільний телефон Apple iPhone 17 Pro 256GB Cosmic Orange (MG8H4AF/A)',
    spec: '256 ГБ · Cosmic Orange · MG8H4AF/A · Pro-камери · USB-C',
    priceUah: 58_999,
    oldPriceUah: null,
    tag: 'Новинка',
    image: ipOrange1,
    categoryId: 'smarfony',
    description:
      'Apple iPhone 17 Pro у кольорі Cosmic Orange (номер моделі MG8H4AF/A) — алюмінієвий unibody, велика квадратна камера з трьома об’єктивами 48 Мп, яскравий дисплей ProMotion і підтримка відеозйомки професійного рівня. У комплекті USB-C кабель для заряджання.',
    gallery: [
      ipOrange1,
      ipOrange2,
      ipOrange3,
      ipOrange4,
      ipOrange5,
      ipOrange6,
      ipOrange7,
      ipOrange8,
      ipOrange9,
      ipOrange10,
    ],
    videos: iphone17ProCosmicOrangeVideos,
    specsTable: [
      { label: 'Номер моделі', value: 'MG8H4AF/A' },
      { label: 'Модель', value: 'iPhone 17 Pro' },
      { label: 'Колір', value: 'Cosmic Orange' },
      { label: 'Об’єм пам’яті', value: '256 ГБ' },
      { label: 'Дисплей', value: 'Super Retina XDR, ProMotion' },
      { label: 'Чип', value: 'Apple A-серії Pro' },
      { label: 'Камера', value: 'Pro: три модулі + LiDAR / спалах' },
      { label: 'Корпус', value: 'Титан, Ceramic Shield' },
      { label: 'Захист', value: 'IP68' },
      { label: 'Порт', value: 'USB-C' },
    ],
    reviews: [
      {
        author: 'Макс Apple',
        rating: 5,
        date: '2026-03-15',
        text: 'Перейшов з 15 Pro — рамки тонші, відео для роботи ідеальне.',
      },
    ],
  },
  {
    id: 'msi-pulse-15',
    name: 'Ноутбук MSI Pulse 15',
    spec: '15,6" · Intel Core · GeForce RTX 3050 · 16 ГБ · SSD 512 ГБ',
    priceUah: 32_499,
    oldPriceUah: null,
    tag: 'Новинка',
    image: imgLaptop,
    categoryId: 'noutbuky',
    description:
      'Ігровий ноутбук MSI Pulse 15 з дисплеєм 144 Гц і відеокартою GeForce RTX 3050. Охолодлення Cooler Boost, підсвічування клавіатури — зручно для ігор і монтажу відео.',
    gallery: [
      imgLaptop,
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80',
    ],
    videos: [
      { title: 'Розпакування та перші враження', youtubeId: 'M7lc1UVf-VE' },
      { title: 'Тест у іграх', youtubeId: 'ysz5S6PUM-U' },
    ],
    specsTable: [
      { label: 'Екран', value: '15,6" FHD, 144 Гц' },
      { label: 'Процесор', value: 'Intel Core (покоління H)' },
      { label: 'Відеокарта', value: 'NVIDIA GeForce RTX 3050' },
      { label: 'Оперативна пам’ять', value: '16 ГБ DDR4' },
      { label: 'Накопичувач', value: 'SSD 512 ГБ' },
      { label: 'Мережа', value: 'Wi-Fi 6E' },
      { label: 'ОС', value: 'Windows 11 Home' },
    ],
    reviews: [
      {
        author: 'Дмитро_геймер',
        rating: 5,
        date: '2026-02-01',
        text: 'FPS у Valorant стабільний, клавіатура приємна. Трохи гріється під навантаженням — норма для класу.',
      },
      {
        author: 'Олена П.',
        rating: 5,
        date: '2025-11-20',
        text: 'Брала сину на навчання + ігри. Все літає, екран дуже плавний.',
      },
    ],
  },
  {
    id: 'tws-earbuds',
    name: 'Бездротові TWS-навушники',
    priceUah: 3_299,
    oldPriceUah: 3_899,
    tag: 'Топ',
    image: imgEarbuds,
    categoryId: 'tb-audio',
    description:
      'TWS-навушники з кейсом-підставкою, шумоподавленням для дзвінків і збалансованим звуком. Зручна посадка, швидке сполучення з телефоном.',
    gallery: [
      imgEarbuds,
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80',
    ],
    videos: [{ title: 'Звук і мікрофон у дзвінках', youtubeId: 'M7lc1UVf-VE' }],
    specsTable: [
      { label: 'Тип', value: 'TWS, вакуумні' },
      { label: 'Bluetooth', value: '5.3' },
      { label: 'Автономність', value: 'до 5 год + кейс 20 год' },
      { label: 'Захист', value: 'IPX4' },
      { label: 'Кодек', value: 'AAC / SBC' },
    ],
    reviews: [
      {
        author: 'Ігор',
        rating: 4,
        date: '2026-01-28',
        text: 'За такі гроші звук нормальний. Кейс заряджає швидко.',
      },
    ],
  },
  {
    id: 'xtrfy-m42-pink',
    name: 'Ігрова миша Xtrfy M42 RGB Pink',
    spec: 'XG-M42-RGB-PINK · корпус honeycomb · дріт у оплітці',
    priceUah: 1_488,
    oldPriceUah: null,
    tag: 'RGB',
    image: imgMouse,
    categoryId: 'igry',
    description:
      'Легка ігрова миша з перфорованим корпусом, яскравим RGB і гнучким кабелем у оплітці. Підходить для claw / fingertip хвату.',
    gallery: [
      imgMouse,
      'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    ],
    videos: [
      { title: 'Огляд сенсора та форми', youtubeId: 'ysz5S6PUM-U' },
    ],
    specsTable: [
      { label: 'Сенсор', value: 'Оптичний, до 16000 DPI' },
      { label: 'Кнопки', value: '6 + колесо' },
      { label: 'Вага', value: '≈ 59 г' },
      { label: 'Кабель', value: 'USB, оплітка 1,8 м' },
      { label: 'ПЗ', value: 'Xtrfy / без драйвера' },
    ],
    reviews: [
      {
        author: 'S1mpleFan',
        rating: 5,
        date: '2025-12-15',
        text: 'Колір вогонь, клік чіткий. Для FPS топ.',
      },
    ],
  },
  {
    id: 'ergo-rvc-10',
    name: 'Робот-пилосос ERGO RVC-10',
    priceUah: 8_450,
    oldPriceUah: 9_990,
    tag: '−15%',
    image: imgVacuum,
    categoryId: 'pobutova',
    description:
      'Робот-пилосос із лідара для карти приміщення, вологим прибиранням і керуванням зі смартфона. Повертається на базу для зарядки.',
    gallery: [
      imgVacuum,
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
    ],
    videos: [{ title: 'Як працює лідар', youtubeId: 'M7lc1UVf-VE' }],
    specsTable: [
      { label: 'Навігація', value: 'LiDAR + датчики перешкод' },
      { label: 'Потужність всмоктування', value: 'до 2500 Па' },
      { label: 'Ємність пилозбірника', value: '350 мл' },
      { label: 'Бак для води', value: '200 мл' },
      { label: 'Акумулятор', value: '5200 мА·год' },
      { label: 'Шум', value: '≤ 65 дБ' },
    ],
    reviews: [
      {
        author: 'Світлана',
        rating: 5,
        date: '2026-02-10',
        text: 'Сам їздить по квартирі, в куточки залазить. Дуже задоволена.',
      },
      {
        author: 'Петро М.',
        rating: 4,
        date: '2025-10-08',
        text: 'Килим прибирає добре. Додаток простий.',
      },
    ],
  },
  {
    id: 'sigma-tab-a1010',
    name: 'Планшет Sigma mobile Tab A1010 Neo 4/64GB 4G Dual Sim',
    spec: '10,1" · LTE · 4/64 ГБ · 8000 мА·год · чорний + чохол-книжка',
    priceUah: 4_999,
    oldPriceUah: null,
    tag: 'Новинка',
    image: imgTablet,
    categoryId: 'gadzhety',
    description:
      '10,1" планшет з LTE і двома SIM для роботи в дорозі та навчання. Великий акумулятор, у комплекті чохол-книжка.',
    gallery: [
      imgTablet,
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80',
    ],
    videos: [{ title: 'Огляд екрана та автономності', youtubeId: 'ysz5S6PUM-U' }],
    specsTable: [
      { label: 'Дисплей', value: '10,1" IPS' },
      { label: 'Пам’ять', value: '4 ГБ / 64 ГБ + microSD' },
      { label: 'Зв’язок', value: '4G LTE, Dual SIM' },
      { label: 'Акумулятор', value: '8000 мА·год' },
      { label: 'Камера', value: '5 Мп + 2 Мп' },
      { label: 'Комплект', value: 'Чохол-книжка' },
    ],
    reviews: [
      {
        author: 'Наталія',
        rating: 5,
        date: '2026-01-05',
        text: 'Дитині для школи — вистачає на день без підзарядки.',
      },
    ],
  },
  {
    id: 'auna-disgo-360',
    name: 'Караоке-система Auna Pro DisGo Box 360 Party BT',
    spec: '2 мікрофони · переносна колонка · 350 Вт',
    priceUah: 5_100,
    oldPriceUah: 5_400,
    tag: 'Акція',
    image: imgPartySpeaker,
    categoryId: 'tb-audio',
    description:
      'Потужна переносна караоке-система з двома мікрофонами, екраном для тексту пісень і світломузикою. Bluetooth, колеса та ручка для транспорту.',
    gallery: [
      imgPartySpeaker,
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
    ],
    videos: [
      { title: 'Демо звуку та підсвічування', youtubeId: 'M7lc1UVf-VE' },
    ],
    specsTable: [
      { label: 'Потужність', value: '350 Вт (муз.)' },
      { label: 'Мікрофони', value: '2 бездротові' },
      { label: 'Підключення', value: 'Bluetooth, USB, AUX' },
      { label: 'Екран', value: 'Кольоровий для тексту' },
      { label: 'Живлення', value: 'Мережа / акумулятор (за моделлю)' },
    ],
    reviews: [
      {
        author: 'Василь',
        rating: 5,
        date: '2025-12-28',
        text: 'На дачі розкачали всю вулицю :) Мікрофони без лагів.',
      },
      {
        author: 'Катя & Роман',
        rating: 4,
        date: '2025-11-11',
        text: 'Важкуватий, але звук соковитий. Екран зручний для текстів.',
      },
    ],
  },
]

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}
