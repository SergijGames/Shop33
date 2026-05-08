/**
 * Seed для Shop31: admin + стартові товари в Postgres.
 * Запуск:
 *   cd server
 *   node seed.mjs
 *
 * Вимагає в server/.env:
 *   DATABASE_URL
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME (опційно)
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import prismaPkg from '@prisma/client'

const { PrismaClient } = prismaPkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const DATABASE_URL = (process.env.DATABASE_URL || '').trim()
if (!DATABASE_URL) {
  console.error('DATABASE_URL missing in server/.env')
  process.exit(1)
}

const prisma = new PrismaClient()

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase()
  const password = (process.env.SEED_ADMIN_PASSWORD || '').trim()
  const name = (process.env.SEED_ADMIN_NAME || 'Administrator').trim()
  if (!email || !password) return

  const exists = await prisma.user.findUnique({ where: { email } })
  const passwordHash = await bcrypt.hash(password, 12)
  if (!exists) {
    await prisma.user.create({
      data: { email, name, passwordHash, role: 'admin' },
    })
    console.log(`Seed admin created: ${email}`)
    return
  }

  await prisma.user.update({
    where: { email },
    data: { name, passwordHash, role: 'admin' },
  })
  console.log(`Seed admin updated: ${email}`)
}

async function seedProducts() {
  // Примітка: у репозиторії товари описані у фронті як TypeScript (`src/data/products.ts`),
  // тому прямий імпорт у Node без TS-рантайму нестабільний.
  // Для “першого наповнення” використовуйте кнопку в адмінці:
  // Admin → Товари → “Опублікувати товари на сервер”.
  return
}

async function main() {
  await seedAdmin()
  await seedProducts()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

