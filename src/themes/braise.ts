import type { ThemeTokens } from './types'

/** Direction A: charbon profond, braise vive réservée aux muscles et aux CTAs. */
export const braise: ThemeTokens = {
  id: 'braise',
  label: 'Braise',
  colors: {
    bg: '#101012',
    surface: '#17171a',
    surface2: '#1e1e22',
    ink: '#f5f2ec',
    inkMuted: '#8b8b92',
    steel: '#8b8b92',
    ember: '#ff8a1e',
    emberCore: '#ffc46a',
    emberDeep: '#8a4110',
    line: '#2a2a2f',
  },
  fonts: {
    display: "'Archivo Variable', sans-serif",
    body: "'Instrument Sans Variable', sans-serif",
    mono: "'JetBrains Mono Variable', monospace",
  },
  displayUppercase: false,
  displayWeight: 800,
  displayStretch: 115,
}
