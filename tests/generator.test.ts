import { describe, expect, it } from 'vitest'
import { generateSession } from '../src/lib/generator'
import { sessionSeconds } from '../src/lib/session'
import { EXERCISE_BY_ID } from '../src/data/exercises'
import type { GeneratorInput } from '../src/lib/generator'
import type { MuscleGroupId } from '../src/data/types'

const base: GeneratorInput = {
  targets: [],
  minutes: 20,
  bells: 1,
  level: 'intermediaire',
  seed: 42,
}

function exercisesOf(input: GeneratorInput) {
  return generateSession(input)
    .steps.filter((s) => s.kind === 'exercise')
    .map((s) => EXERCISE_BY_ID[s.exerciseId!])
}

describe('generator', () => {
  it('is deterministic for a given seed and varies with the seed', () => {
    const a = generateSession({ ...base, seed: 7 })
    const b = generateSession({ ...base, seed: 7 })
    expect(a.steps).toEqual(b.steps)
    expect(a.rounds).toBe(b.rounds)

    const seeds = [1, 2, 3, 4, 5, 6, 7, 8]
    const signatures = new Set(
      seeds.map((seed) =>
        generateSession({ ...base, seed })
          .steps.map((s) => s.exerciseId ?? s.kind)
          .join('|'),
      ),
    )
    expect(signatures.size).toBeGreaterThan(1)
  })

  it('covers every coverable target as a primary mover', () => {
    const cases: MuscleGroupId[][] = [
      ['pectoraux', 'biceps'],
      ['quadriceps', 'dorsaux', 'abdominaux'],
      ['fessiers', 'epaules'],
      ['obliques', 'ischios'],
      ['trapezes', 'lombaires'],
    ]
    for (const targets of cases) {
      for (const seed of [1, 11, 21]) {
        const covered = new Set(
          exercisesOf({ ...base, targets, seed }).flatMap((ex) => ex.primary),
        )
        for (const t of targets) expect(covered, `targets=${targets} seed=${seed}`).toContain(t)
      }
    }
  })

  it('keeps the circuit focused on the requested muscles', () => {
    const cases: MuscleGroupId[][] = [
      ['quadriceps', 'fessiers'],
      ['dorsaux', 'biceps'],
      ['abdominaux', 'obliques'],
      ['epaules'],
    ]
    for (const targets of cases) {
      for (const seed of [2, 12, 22, 32]) {
        const exercises = exercisesOf({ ...base, targets, seed })
        const touching = exercises.filter(
          (ex) =>
            ex.primary.some((m) => targets.includes(m)) ||
            ex.secondary.some((m) => targets.includes(m)),
        )
        expect(
          touching.length,
          `targets=${targets} seed=${seed}: ${exercises.map((e) => e.id).join(',')}`,
        ).toBeGreaterThanOrEqual(Math.ceil(exercises.length / 2))
      }
    }
  })

  it('never schedules two heavy hinges back to back and caps patterns at 2', () => {
    for (const seed of Array.from({ length: 20 }, (_, i) => i + 1)) {
      const exercises = exercisesOf({ ...base, seed, targets: ['fessiers', 'ischios', 'lombaires'] })
      for (let i = 1; i < exercises.length; i++) {
        expect(exercises[i - 1].heavyHinge && exercises[i].heavyHinge).not.toBe(true)
      }
      const counts = new Map<string, number>()
      exercises.forEach((ex) => counts.set(ex.pattern, (counts.get(ex.pattern) ?? 0) + 1))
      for (const [, n] of counts) expect(n).toBeLessThanOrEqual(2)
    }
  })

  it('builds 4 to 6 exercises and fits the requested duration within 10 percent', () => {
    for (const minutes of [20, 30, 40]) {
      for (const seed of [3, 13, 23]) {
        const session = generateSession({ ...base, minutes, seed })
        const count = session.steps.filter((s) => s.kind === 'exercise').length
        expect(count).toBeGreaterThanOrEqual(4)
        expect(count).toBeLessThanOrEqual(6)
        const total = sessionSeconds(session)
        expect(Math.abs(total - minutes * 60) / (minutes * 60)).toBeLessThanOrEqual(0.1)
      }
    }
  })

  it('respects level pool and bell count', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const deb = exercisesOf({ ...base, level: 'debutant', seed })
      expect(deb.every((ex) => ex.level === 'debutant')).toBe(true)
      const oneBell = exercisesOf({ ...base, bells: 1, seed })
      expect(oneBell.every((ex) => ex.bells !== 2)).toBe(true)
    }
  })
})
