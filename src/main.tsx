import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (all OFL). Browsers only download the families the
// active theme actually uses; the others stay as inert @font-face rules.
import '@fontsource-variable/archivo'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource/anton'
import '@fontsource-variable/public-sans'
import '@fontsource/ibm-plex-mono'
import '@fontsource-variable/syne'
import '@fontsource-variable/figtree'
import '@fontsource/space-mono'

import './index.css'
import App from './App.tsx'
import { applyTheme, loadThemeId } from './themes'
import { registerSW } from 'virtual:pwa-register'

applyTheme(loadThemeId())
// Offline mode: precache the whole app, auto-update on new deploys.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
