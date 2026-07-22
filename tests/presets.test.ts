import { describe, expect, it } from 'vitest'
import { PRESETS } from '../src/data/presets'
import { EXERCISES, EXERCISE_BY_ID } from '../src/data/exercises'
import { sessionSeconds } from '../src/lib/session'

describe('exercise base', () => {
  it('matches the verified FIT ids from the brief §3.2', () => {
    const expected: Record<string, [number, number]> = {
      kb_swing: [10, 23], kb_swing_1b: [12, 0], kb_deadlift: [8, 20],
      kb_sdhp: [8, 16], kb_snatch: [18, 18], goblet_squat: [28, 37],
      kb_squat: [28, 38], rev_lunge: [17, 38], kb_row: [23, 9],
      kb_curl: [7, 24], sa_press: [24, 18], floor_press: [0, 15],
      kb_chest_press: [0, 12], half_tgu: [5, 16], tgu: [5, 89],
      windmill: [5, 17], kb_situp: [27, 14], farmer: [3, 7],
      suitcase: [3, 7], waiter: [3, 5],
      // Extension batch, ids verified against Profile.types of fitsdk 21.208.0
      kb_clean: [18, 12], kb_clean_press: [18, 27], kb_push_press: [24, 8],
      kb_jerk: [18, 15], kb_thruster: [28, 79], goblet_lunge: [17, 77],
      step_up: [28, 67], gorilla_row: [23, 9], renegade_row: [23, 15],
      racked_carry: [3, 7], overhead_carry: [3, 4], kb_sumo_deadlift: [8, 21],
      kb_flye: [9, 4], kb_leg_raises: [16, 5], kb_overhead_swing: [28, 39],
    }
    expect(EXERCISES).toHaveLength(Object.keys(expected).length)
    for (const [id, [category, exercise]] of Object.entries(expected)) {
      expect(EXERCISE_BY_ID[id], id).toBeDefined()
      expect(EXERCISE_BY_ID[id].fitCategory, id).toBe(category)
      expect(EXERCISE_BY_ID[id].fitExercise, id).toBe(exercise)
    }
  })
})

describe('presets', () => {
  it('ships 12 routines: 3 Intégrales per level plus the 3 specials', () => {
    expect(PRESETS).toHaveLength(12)
    const ids = new Set(PRESETS.map((p) => p.id))
    expect(ids.size).toBe(12)
    const integrales = PRESETS.filter((p) => p.id.startsWith('integrale-'))
    expect(integrales).toHaveLength(9)
    for (const level of ['debutant', 'intermediaire', 'avance'] as const) {
      expect(integrales.filter((p) => p.level === level)).toHaveLength(3)
    }
    expect(integrales.every((p) => p.minutes === 20)).toBe(true)
  })

  it('references existing exercises and consistent bell counts', () => {
    for (const preset of PRESETS) {
      for (const step of preset.steps) {
        if (step.kind !== 'exercise') continue
        const ex = EXERCISE_BY_ID[step.exerciseId!]
        expect(ex, `${preset.id}: ${step.exerciseId}`).toBeDefined()
        if (preset.bells === 1) {
          expect(ex.bells, `${preset.id}: ${ex.id}`).not.toBe(2)
        }
        expect(step.reps != null || step.seconds != null).toBe(true)
      }
    }
  })

  it('keeps every routine close to its announced duration', () => {
    for (const preset of PRESETS) {
      const total = sessionSeconds(preset)
      const target = preset.minutes * 60
      expect(
        Math.abs(total - target) / target,
        `${preset.id}: ${total}s for ${target}s`,
      ).toBeLessThanOrEqual(0.12)
    }
  })
})
