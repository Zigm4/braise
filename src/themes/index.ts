import { braise } from './braise'
import { acier } from './acier'
import { fusion } from './fusion'
import type { ThemeTokens } from './types'

export const THEMES: ThemeTokens[] = [braise, acier, fusion]
export const DEFAULT_THEME = braise.id

const STORAGE_KEY = 'braise:theme'

export function loadThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

/** Applies a theme's tokens as CSS variables on the document root. */
export function applyTheme(id: string): ThemeTokens {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0]
  const root = document.documentElement
  root.dataset.theme = theme.id
  const c = theme.colors
  const vars: Record<string, string> = {
    '--bg': c.bg,
    '--surface': c.surface,
    '--surface-2': c.surface2,
    '--ink': c.ink,
    '--ink-muted': c.inkMuted,
    '--steel': c.steel,
    '--ember': c.ember,
    '--ember-core': c.emberCore,
    '--ember-deep': c.emberDeep,
    '--line': c.line,
    '--font-display': theme.fonts.display,
    '--font-body': theme.fonts.body,
    '--font-mono': theme.fonts.mono,
    '--display-weight': String(theme.displayWeight),
    '--display-transform': theme.displayUppercase ? 'uppercase' : 'none',
    '--display-stretch': theme.displayStretch ? `${theme.displayStretch}%` : 'normal',
  }
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  try {
    localStorage.setItem(STORAGE_KEY, theme.id)
  } catch {
    // localStorage unavailable (private mode): theme just resets next visit.
  }
  return theme
}
