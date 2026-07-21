export interface ThemeTokens {
  id: string
  label: string
  colors: {
    bg: string
    surface: string
    surface2: string
    ink: string
    inkMuted: string
    steel: string
    ember: string
    emberCore: string
    emberDeep: string
    line: string
  }
  fonts: {
    display: string
    body: string
    mono: string
  }
  /** Extra letter treatment of big titles (Anton wants uppercase, others not). */
  displayUppercase: boolean
  displayWeight: number
  /** font-stretch percentage for variable-width display faces. */
  displayStretch?: number
}
