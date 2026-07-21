import { THEMES } from '../../themes'

interface ThemePickerProps {
  themeId: string
  onChange: (id: string) => void
}

export function ThemePicker({ themeId, onChange }: ThemePickerProps) {
  return (
    <div className="seg" role="group" aria-label="Thème">
      {THEMES.map((t) => (
        <button key={t.id} aria-pressed={themeId === t.id} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}
