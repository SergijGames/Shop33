/**
 * Shop31 — вхід SPA (точка монтування React).
 * Підключає глобальні стилі й рендерить кореневий компонент додатка.
 * Зв’язки: App.tsx (маршрути), ./index.css
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
