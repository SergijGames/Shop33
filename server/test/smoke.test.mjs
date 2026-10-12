/**
 * Shop33 — smoke test: the API boots without external services and /api/health responds.
 * Run: npm test (in server/) — uses Node's built-in test runner, no extra deps.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 4300 + Math.floor(Math.random() * 500)

test('API starts and /api/health returns ok', async (t) => {
  const child = spawn(process.execPath, ['index.mjs'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(PORT), DATABASE_URL: '', STRIPE_SECRET_KEY: '', LIQPAY_PUBLIC_KEY: '', LIQPAY_PRIVATE_KEY: '' },
    stdio: 'ignore',
  })
  t.after(() => child.kill())

  let body
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/health`)
      if (res.ok) { body = await res.json(); break }
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200))
  }
  assert.ok(body, 'server did not respond on /api/health')
  assert.equal(body.ok, true)
})
