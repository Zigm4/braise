import type { ThemeTokens } from './types'

/** Direction C: métal en fusion, plus sombre, chaleur tirée vers le rouge. */
export const fusion: ThemeTokens = {
  id: 'fusion',
  label: 'Fusion',
  colors: {
    bg: '#0d0d0f',
    surface: '#141417',
    surface2: '#1b1b1f',
    ink: '#f6f1ea',
    inkMuted: '#8f8a8d',
    steel: '#8f8a8d',
    ember: '#ff6a2a',
    emberCore: '#ffb35c',
    emberDeep: '#8f2d0e',
    line: '#262529',
  },
  fonts: {
    display: "'Syne Variable', sans-serif",
    body: "'Figtree Variable', sans-serif",
    mono: "'Space Mono', monospace",
  },
  displayUppercase: false,
  displayWeight: 700,
}
