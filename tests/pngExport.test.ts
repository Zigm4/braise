import { describe, expect, it } from 'vitest'
import { buildSessionSvg } from '../src/lib/pngExport'
import { PRESET_BY_ID } from '../src/data/presets'
import { sessionMuscles } from '../src/lib/session'

describe('PNG export SVG', () => {
  it('renders the 1200x1740 card with title, exercises, figures and legend', () => {
    const session = PRESET_BY_ID['integrale-2-1']
    const svg = buildSessionSvg(session)

    expect(svg).toContain('width="1200" height="1740"')
    expect(svg).toContain('INTÉGRALE II.1 · BRAISE COMPLÈTE')
    expect(svg).toContain('Swing à deux mains')
    expect(svg).toContain('Sollicitation principale')
    expect(svg).toContain('Secondaire')
    expect(svg).toContain('FACE')
    expect(svg).toContain('DOS')

    // Primary muscles use the hot gradient, secondaries the deep one.
    const usage = sessionMuscles(session)
    expect(usage.primary.length).toBeGreaterThan(0)
    expect(svg).toContain('url(#pngHot)')
    expect(svg).toContain('url(#pngDeep)')

    // XML must stay well-formed for canvas rasterization.
    expect(svg).not.toContain('&reps')
    expect((svg.match(/<svg/g) ?? []).length).toBe(1)
  })
})
