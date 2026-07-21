import { describe, expect, it } from 'vitest'
import { generateSession } from '../src/lib/generator'
import type { GeneratorInput } from '../src/lib/generator'
import { sessionSeconds } from '../src/lib/session'
import { EXERCISE_BY_ID } from '../src/data/exercises'
import { MUSCLE_GROUPS } from '../src/data/muscles'
import type { Level, MuscleGroupId } from '../src/data/types'

const LEVELS: Level[] = ['debutant', 'intermediaire', 'avance']

function exercisesOf(input: GeneratorInput) {
  return generateSession(input)
    .steps.filter((s) => s.kind === 'exercise')
    .map((s) => EXERCISE_BY_ID[s.exerciseId!])
}

describe('audit sweep', () => {
  it('duration within 10% for all UI-reachable inputs', () => {
    const failures: string[] = []
    for (const minutes of [20, 30, 40]) {
      for (const level of LEVELS) {
        for (const bells of [1, 2] as const) {
          const targetSets: MuscleGroupId[][] = [
            [],
            ...MUSCLE_GROUPS.map((m) => [m]),
            ['fessiers', 'ischios'],
            ['pectoraux', 'biceps', 'epaules'],
          ]
          for (const targets of targetSets) {
            for (let seed = 1; seed <= 30; seed++) {
              const s = generateSession({ targets, minutes, bells, level, seed })
              const total = sessionSeconds(s)
              const dev = Math.abs(total - minutes * 60) / (minutes * 60)
              if (dev > 0.1) {
                failures.push(
                  `min=${minutes} lvl=${level} bells=${bells} targets=${targets.join('+') || 'full'} seed=${seed}: total=${total}s dev=${(dev * 100).toFixed(1)}% rounds=${s.rounds}`,
                )
              }
            }
          }
        }
      }
    }
    expect(failures.slice(0, 25), `${failures.length} failures`).toEqual([])
  })

  it('heavy hinge adjacency including round wrap, pattern caps, volume floors', () => {
    const adj: string[] = []
    const caps: string[] = []
    const vols: string[] = []
    for (const level of LEVELS) {
      for (const bells of [1, 2] as const) {
        for (let seed = 1; seed <= 60; seed++) {
          const s = generateSession({ targets: [], minutes: 20, bells, level, seed })
          const exs = s.steps
            .filter((st) => st.kind === 'exercise')
            .map((st) => EXERCISE_BY_ID[st.exerciseId!])
          for (let i = 1; i < exs.length; i++) {
            if (exs[i - 1].heavyHinge && exs[i].heavyHinge)
              adj.push(`lvl=${level} bells=${bells} seed=${seed}: ${exs[i - 1].id}->${exs[i].id}`)
          }
          const counts = new Map<string, number>()
          exs.forEach((e) => counts.set(e.pattern, (counts.get(e.pattern) ?? 0) + 1))
          for (const [p, n] of counts) if (n > 2) caps.push(`lvl=${level} seed=${seed} ${p}=${n}`)
          for (const st of s.steps) {
            if (st.kind !== 'exercise') continue
            if (st.reps != null && st.reps < 1) vols.push(`reps=${st.reps} ${st.exerciseId}`)
            if (st.seconds != null && st.seconds < 10) vols.push(`sec=${st.seconds} ${st.exerciseId}`)
          }
        }
      }
    }
    expect(adj).toEqual([])
    expect(caps).toEqual([])
    expect(vols).toEqual([])
  })

  it('primary coverage per target and level', () => {
    const gaps: string[] = []
    for (const level of LEVELS) {
      for (const bells of [1, 2] as const) {
        for (const target of MUSCLE_GROUPS) {
          let covered = false
          for (const seed of [1, 2, 3]) {
            const exs = exercisesOf({ targets: [target], minutes: 20, bells, level, seed })
            if (exs.some((e) => e.primary.includes(target))) covered = true
          }
          if (!covered) gaps.push(`lvl=${level} bells=${bells} target=${target}`)
        }
      }
    }
    // report, do not assert
    console.log('PRIMARY COVERAGE GAPS:\n' + gaps.join('\n'))
  })

  it('exercise count bounds', () => {
    const bad: string[] = []
    for (const level of LEVELS) {
      for (const bells of [1, 2] as const) {
        for (const target of [[], ...MUSCLE_GROUPS.map((m) => [m])] as MuscleGroupId[][]) {
          for (let seed = 1; seed <= 10; seed++) {
            const n = exercisesOf({ targets: target, minutes: 20, bells, level, seed }).length
            if (n < 4 || n > 6) bad.push(`lvl=${level} bells=${bells} t=${target.join('+')} seed=${seed} n=${n}`)
          }
        }
      }
    }
    expect(bad).toEqual([])
  })
})
