import { describe, expect, it } from 'vitest'
import { warmupPlan, WARMUP_MOVE_COUNT, warmupMoveSeconds } from '../src/lib/warmup'
import { WARMUP_MOVES } from '../src/data/warmups'
import { MUSCLE_GROUPS } from '../src/data/muscles'
import { PRESETS, PRESET_BY_ID } from '../src/data/presets'
import { sessionMuscles } from '../src/lib/session'
import { GENERATOR_CONFIG } from '../src/data/generatorConfig'

describe('warmup plan', () => {
  it('covers every muscle group with at least one pool move', () => {
    const reachable = new Set(WARMUP_MOVES.flatMap((m) => m.targets))
    for (const group of MUSCLE_GROUPS) expect(reachable, group).toContain(group)
  })

  it('always returns 4 distinct moves filling the warmup block', () => {
    for (const preset of PRESETS) {
      const plan = warmupPlan(preset)
      expect(plan).toHaveLength(WARMUP_MOVE_COUNT)
      expect(new Set(plan.map((m) => m.id)).size).toBe(WARMUP_MOVE_COUNT)
    }
    expect(warmupMoveSeconds() * WARMUP_MOVE_COUNT).toBe(GENERATOR_CONFIG.warmupSeconds)
  })

  it('is deterministic and matched to the session muscles', () => {
    const session = PRESET_BY_ID['integrale-2-1']
    const a = warmupPlan(session).map((m) => m.id)
    const b = warmupPlan(session).map((m) => m.id)
    expect(a).toEqual(b)

    const usage = sessionMuscles(session)
    const worked = new Set([...usage.primary, ...usage.secondary])
    const touched = new Set(
      warmupPlan(session).flatMap((m) => m.targets.filter((t) => worked.has(t))),
    )
    expect(touched.size).toBeGreaterThanOrEqual(4)
  })
})
