import { EXERCISES } from '../data/exercises'
import { GENERATOR_CONFIG, LEVEL_TAGS } from '../data/generatorConfig'
import { MUSCLE_LABELS } from '../data/muscles'
import type { Exercise, Level, MuscleGroupId, Session, SessionStep } from '../data/types'
import { COOLDOWN_STEP, REST_STEP, WARMUP_STEP, exerciseStep } from './session'

export interface GeneratorInput {
  /** Target muscle groups; empty array means full body. */
  targets: MuscleGroupId[]
  minutes: number
  bells: 1 | 2
  level: Level
  seed: number
  weightKg?: number
  double?: boolean
}

/** Deterministic PRNG (mulberry32): same seed, same session. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function availablePool(input: GeneratorInput): Exercise[] {
  const levels = GENERATOR_CONFIG.levelPool[input.level] as readonly Level[]
  return EXERCISES.filter((ex) => {
    if (!levels.includes(ex.level)) return false
    if (input.bells === 1 && ex.bells === 2) return false
    return true
  })
}

/**
 * Picks 4 to 6 exercises covering every target as a PRIMARY mover,
 * then fills the circuit with target-relevant work first, balancing
 * movement patterns (at most 2 per pattern).
 */
function pickExercises(input: GeneratorInput, rng: () => number): Exercise[] {
  const targets = input.targets.length > 0
    ? input.targets
    : (GENERATOR_CONFIG.fullBodyTargets as readonly MuscleGroupId[])
  const targetSet = new Set(targets)
  const pool = shuffled(availablePool(input), rng)
  const picked: Exercise[] = []
  const patternCount = new Map<string, number>()
  const uncovered = new Set(targets)

  const canTake = (ex: Exercise) =>
    !picked.includes(ex) && (patternCount.get(ex.pattern) ?? 0) < 2
  const take = (ex: Exercise) => {
    picked.push(ex)
    patternCount.set(ex.pattern, (patternCount.get(ex.pattern) ?? 0) + 1)
    ex.primary.forEach((m) => uncovered.delete(m))
  }
  /** How much an exercise works the requested muscles. */
  const relevance = (ex: Exercise) =>
    ex.primary.filter((m) => targetSet.has(m)).length * 2 +
    ex.secondary.filter((m) => targetSet.has(m)).length

  // Phase 1: cover every target with primary movers.
  while (uncovered.size > 0 && picked.length < GENERATOR_CONFIG.maxExercises) {
    let best: Exercise | null = null
    let bestScore = 0
    for (const ex of pool) {
      if (!canTake(ex)) continue
      const score = ex.primary.filter((m) => uncovered.has(m)).length
      if (score > bestScore) {
        best = ex
        bestScore = score
      }
    }
    if (!best) break
    take(best)
  }

  // Phase 2: fill to the circuit size, target-relevant exercises first,
  // then unexplored patterns. Ties keep the shuffled order (variety).
  while (picked.length < GENERATOR_CONFIG.minExercises) {
    const candidates = pool.filter(canTake)
    if (candidates.length === 0) break
    candidates.sort((a, b) => {
      const byRelevance = relevance(b) - relevance(a)
      if (byRelevance !== 0) return byRelevance
      const aNew = (patternCount.get(a.pattern) ?? 0) === 0 ? 0 : 1
      const bNew = (patternCount.get(b.pattern) ?? 0) === 0 ? 0 : 1
      return aNew - bNew
    })
    take(candidates[0])
  }
  return picked
}

/** Orders the circuit so two heavy hinges never follow each other. */
function orderExercises(picked: Exercise[], rng: () => number): Exercise[] {
  const remaining = shuffled(picked, rng)
  const ordered: Exercise[] = []
  // Classic kettlebell opener: start with a hinge when one exists.
  const opener = remaining.find((e) => e.pattern === 'hinge') ?? remaining[0]
  ordered.push(opener)
  remaining.splice(remaining.indexOf(opener), 1)
  while (remaining.length > 0) {
    const prev = ordered[ordered.length - 1]
    const next =
      remaining.find((e) => !(prev.heavyHinge && e.heavyHinge) && e.pattern !== prev.pattern) ??
      remaining.find((e) => !(prev.heavyHinge && e.heavyHinge)) ??
      remaining[0]
    ordered.push(next)
    remaining.splice(remaining.indexOf(next), 1)
  }
  return ordered
}

interface Volume { reps?: number; seconds?: number }

function baseVolume(ex: Exercise, level: Level): Volume {
  const factor = GENERATOR_CONFIG.levelVolume[level]
  if (ex.defaultSeconds != null) {
    return { seconds: Math.max(10, Math.round((ex.defaultSeconds * factor) / 5) * 5) }
  }
  return { reps: Math.max(1, Math.round((ex.defaultReps ?? 8) * factor)) }
}

function volumeSeconds(ex: Exercise, v: Volume): number {
  const sides = ex.unilateral ? 2 : 1
  if (v.seconds != null) return v.seconds * sides
  const perRep = ex.repSeconds ?? GENERATOR_CONFIG.secondsPerRep
  return (v.reps ?? 0) * sides * perRep
}

/**
 * Computes rounds then rescales volumes so the total lands as close as
 * possible to the requested duration.
 */
function fitToDuration(
  ordered: Exercise[],
  volumes: Volume[],
  minutes: number,
): { rounds: number; volumes: Volume[] } {
  const cfg = GENERATOR_CONFIG
  const available = minutes * 60 - cfg.warmupSeconds - cfg.cooldownSeconds
  const transitions = ordered.length * cfg.transitionSeconds
  const baseWork = ordered.reduce((sum, ex, i) => sum + volumeSeconds(ex, volumes[i]), 0)
  const baseRound = baseWork + transitions + cfg.restSeconds
  const rounds = Math.min(8, Math.max(1, Math.round(available / baseRound)))
  const targetWork = available / rounds - transitions - cfg.restSeconds
  const scale = Math.min(1.5, Math.max(0.6, targetWork / baseWork))
  const scaled = volumes.map((v) => {
    if (v.seconds != null) {
      return { seconds: Math.max(10, Math.round((v.seconds * scale) / 5) * 5) }
    }
    return { reps: Math.max(1, Math.round((v.reps ?? 0) * scale)) }
  })
  return { rounds, volumes: scaled }
}

function sessionName(input: GeneratorInput): string {
  if (input.targets.length === 0) return 'Full body sur mesure'
  const labels = input.targets.slice(0, 2).map((m) => MUSCLE_LABELS[m])
  const extra = input.targets.length > 2 ? ` +${input.targets.length - 2}` : ''
  return `${labels.join(' et ')}${extra}`
}

export function generateSession(input: GeneratorInput): Session {
  const rng = mulberry32(input.seed)
  const picked = pickExercises(input, rng)
  const ordered = orderExercises(picked, rng)
  const volumes = ordered.map((ex) => baseVolume(ex, input.level))
  const fitted = fitToDuration(ordered, volumes, input.minutes)

  const steps: SessionStep[] = [
    WARMUP_STEP,
    ...ordered.map((ex, i) => exerciseStep(ex, fitted.volumes[i])),
    REST_STEP,
    COOLDOWN_STEP,
  ]

  return {
    id: `gen-${input.seed.toString(36)}-${Date.now().toString(36)}`,
    name: sessionName(input),
    level: input.level,
    bells: input.bells,
    minutes: input.minutes,
    rounds: fitted.rounds,
    restSeconds: GENERATOR_CONFIG.restSeconds,
    steps,
    weightKg: input.weightKg,
    double: input.double,
    seed: input.seed,
    targets: [...input.targets],
  }
}

/** Exported workout name: app · session · level tag (kept short for watches). */
export function exportName(session: Session): string {
  return `Braise · ${session.name} · ${LEVEL_TAGS[session.level]}`
}
