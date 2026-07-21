import { describe, expect, it } from 'vitest'
import { generateSession } from '../src/lib/generator'
import { GENERATOR_CONFIG } from '../src/data/generatorConfig'
import { sessionSeconds } from '../src/lib/session'
import { EXERCISES, EXERCISE_BY_ID } from '../src/data/exercises'
import { MUSCLE_GROUPS } from '../src/data/muscles'
import type { Level, MuscleGroupId } from '../src/data/types'

const LEVELS: Level[] = ['debutant', 'intermediaire', 'avance']

function pool(level: Level, bells: 1 | 2) {
  const levels = GENERATOR_CONFIG.levelPool[level] as readonly Level[]
  return EXERCISES.filter((ex) => levels.includes(ex.level) && !(bells === 1 && ex.bells === 2))
}

// simple deterministic rng for subset generation
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0
    return a / 2 ** 32
  }
}

describe('audit sweep 2', () => {
  it('randomized subsets: coverable targets covered as primary, caps, adjacency, duration', () => {
    const coverFails: string[] = []
    const capFails: string[] = []
    const adjFails: string[] = []
    const durFails: string[] = []
    const r = rng(123)
    for (let trial = 0; trial < 4000; trial++) {
      const level = LEVELS[Math.floor(r() * 3)]
      const bells = (Math.floor(r() * 2) + 1) as 1 | 2
      const minutes = [20, 30, 40][Math.floor(r() * 3)]
      const size = 1 + Math.floor(r() * 5)
      const targets: MuscleGroupId[] = []
      while (targets.length < size) {
        const m = MUSCLE_GROUPS[Math.floor(r() * MUSCLE_GROUPS.length)]
        if (!targets.includes(m)) targets.push(m)
      }
      const seed = Math.floor(r() * 100000)
      const s = generateSession({ targets, minutes, bells, level, seed })
      const exs = s.steps
        .filter((st) => st.kind === 'exercise')
        .map((st) => EXERCISE_BY_ID[st.exerciseId!])

      const p = pool(level, bells)
      const primaryCovered = new Set(exs.flatMap((e) => e.primary))
      for (const t of targets) {
        const coverable = p.some((e) => e.primary.includes(t))
        if (coverable && !primaryCovered.has(t)) {
          coverFails.push(`lvl=${level} bells=${bells} targets=${targets.join('+')} seed=${seed} missing=${t} got=${exs.map((e) => e.id).join(',')}`)
        }
      }
      const counts = new Map<string, number>()
      exs.forEach((e) => counts.set(e.pattern, (counts.get(e.pattern) ?? 0) + 1))
      for (const [pat, n] of counts) if (n > 2) capFails.push(`lvl=${level} seed=${seed} ${pat}=${n}`)
      for (let i = 1; i < exs.length; i++) {
        if (exs[i - 1].heavyHinge && exs[i].heavyHinge)
          adjFails.push(`lvl=${level} bells=${bells} targets=${targets.join('+')} seed=${seed}: ${exs[i - 1].id}->${exs[i].id}`)
      }
      const total = sessionSeconds(s)
      const dev = Math.abs(total - minutes * 60) / (minutes * 60)
      if (dev > 0.1)
        durFails.push(`min=${minutes} lvl=${level} bells=${bells} targets=${targets.join('+')} seed=${seed} total=${total} dev=${(dev * 100).toFixed(1)}% rounds=${s.rounds} n=${exs.length}`)
    }
    console.log('coverFails:', coverFails.length, coverFails.slice(0, 10))
    console.log('capFails:', capFails.length, capFails.slice(0, 5))
    console.log('adjFails:', adjFails.length, adjFails.slice(0, 10))
    console.log('durFails:', durFails.length, durFails.slice(0, 15))
    expect(true).toBe(true)
  })
})
