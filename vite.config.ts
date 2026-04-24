/**
 * Shop31 — конфігурація збірки Vite (frontend).
 * base для file://, проксі /api на payment server, плагін для index.html у dist.
 * Зв’язки: index.html, server/index.mjs (порт за замовчуванням 4242)
 */
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * З file:// атрибут crossorigin на <script type="module"> / <link> часто дає порожню
 * сторінку (модулі не виконуються). Після збірки прибираємо його з dist/index.html.
 */
function stripHtmlCrossorigin(): Plugin {
  let outDir = ''
  return {
    name: 'strip-html-crossorigin',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const indexPath = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexPath)) return
      const html = fs
        .readFileSync(indexPath, 'utf-8')
        .replace(/\s+crossorigin(?:="[^"]*")?/g, '')
      fs.writeFileSync(indexPath, html)
      // GitHub Pages: без цього прямий захід на /repo/cart дає 404; Pages підставляє 404.html
      fs.copyFileSync(indexPath, path.join(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Dev: '/' — коректний HMR і шляхи. Build: './' — ресурси поруч з index.html (file://).
  base: command === 'build' ? './' : '/',
  /** Без source map: у DevTools немає мапи на ваші .tsx/.ts (залишається лише мінімізований JS у bundle). */
  build: {
    sourcemap: false,
  },
  plugins: [react(), stripHtmlCrossorigin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4242',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4242',
        changeOrigin: true,
      },
    },
  },
}))
