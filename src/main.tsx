import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UiI18nProvider } from './i18n/ui'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiI18nProvider>
      <App />
    </UiI18nProvider>
  </StrictMode>,
)
