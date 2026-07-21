import { describe, expect, it } from 'vitest'
import { generateSession } from '../src/lib/generator'
import { sessionSeconds } from '../src/lib/session'
import { EXERCISE_BY_ID } from '../src/data/exercises'

describe('probes', () => {
  it('out-of-range minutes deviation', () => {
    for (const minutes of [10, 15, 50, 60]) {
      let worst = 0
      let worstAt = ''
      for (let seed = 1; seed <= 50; seed++) {
        for (const level of ['debutant', 'intermediaire', 'avance'] as const) {
          const s = generateSession({ targets: [], minutes, bells: 1, level, seed })
          const total = sessionSeconds(s)
          const dev = Math.abs(total - minutes * 60) / (minutes * 60)
          if (dev > worst) {
            worst = dev
            worstAt = `lvl=${level} seed=${seed} total=${total} rounds=${s.rounds}`
          }
        }
      }
      console.log(`minutes=${minutes} worst dev=${(worst * 100).toFixed(1)}% ${worstAt}`)
    }
    expect(true).toBe(true)
  })

  it('mollets with 1 bell: does any exercise touch mollets?', () => {
    for (const seed of [1, 5, 9]) {
      const s = generateSession({ targets: ['mollets'], minutes: 20, bells: 1, level: 'intermediaire', seed })
      const exs = s.steps.filter((st) => st.kind === 'exercise').map((st) => EXERCISE_BY_ID[st.exerciseId!])
      const touches = exs.filter((e) => e.primary.includes('mollets') || e.secondary.includes('mollets'))
      console.log(`seed=${seed} name="${s.name}" exercises=${exs.map((e) => e.id).join(',')} touching=${touches.length}`)
    }
    expect(true).toBe(true)
  })

  it('adducteurs target: secondary only', () => {
    const s = generateSession({ targets: ['adducteurs'], minutes: 20, bells: 1, level: 'avance', seed: 3 })
    const exs = s.steps.filter((st) => st.kind === 'exercise').map((st) => EXERCISE_BY_ID[st.exerciseId!])
    console.log(`name="${s.name}" exs=${exs.map((e) => e.id).join(',')}`)
    expect(true).toBe(true)
  })
})
