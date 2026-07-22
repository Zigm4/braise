import { WARMUP_MOVES, type WarmupMove } from '../data/warmups'
import { GENERATOR_CONFIG } from '../data/generatorConfig'
import type { Session } from '../data/types'
import { sessionMuscles } from './session'

export const WARMUP_MOVE_COUNT = 4

export function warmupMoveSeconds(): number {
  return Math.round(GENERATOR_CONFIG.warmupSeconds / WARMUP_MOVE_COUNT)
}

/** Small deterministic hash so the same session always warms up the same way. */
function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Picks 4 warmup movements matched to the session's muscles: primaries
 * weigh double, uncovered targets first, deterministic tie-break on the
 * session id.
 */
export function warmupPlan(session: Session): WarmupMove[] {
  const usage = sessionMuscles(session)
  const primary = new Set(usage.primary)
  const secondary = new Set(usage.secondary)
  const seed = hashString(session.id)

  const uncovered = new Set([...usage.primary, ...usage.secondary])
  const picked: WarmupMove[] = []
  const pool = [...WARMUP_MOVES].sort(
    (a, b) => (hashString(a.id) ^ seed) - (hashString(b.id) ^ seed),
  )

  const score = (move: WarmupMove, targetSet: Set<string>) =>
    move.targets.reduce(
      (sum, m) =>
        sum + (targetSet.has(m) ? (primary.has(m) ? 2 : secondary.has(m) ? 1 : 0) : 0),
      0,
    )

  while (picked.length < WARMUP_MOVE_COUNT) {
    let best: WarmupMove | null = null
    let bestScore = -1
    for (const move of pool) {
      if (picked.includes(move)) continue
      const s = uncovered.size > 0 ? score(move, uncovered) : score(move, new Set([...primary, ...secondary]))
      if (s > bestScore) {
        best = move
        bestScore = s
      }
    }
    if (!best) break
    picked.push(best)
    best.targets.forEach((m) => uncovered.delete(m))
  }
  return picked
}
