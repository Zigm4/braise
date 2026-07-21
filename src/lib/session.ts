import { EXERCISE_BY_ID } from '../data/exercises'
import { GENERATOR_CONFIG } from '../data/generatorConfig'
import type { Exercise, MuscleGroupId, MuscleUsage, Session, SessionStep } from '../data/types'

/** Working seconds of one exercise step (both sides for unilateral moves). */
export function stepSeconds(step: SessionStep): number {
  if (step.kind !== 'exercise' || !step.exerciseId) return 0
  const ex = EXERCISE_BY_ID[step.exerciseId]
  const sides = ex.unilateral ? 2 : 1
  if (step.seconds != null) return step.seconds * sides
  const perRep = ex.repSeconds ?? GENERATOR_CONFIG.secondsPerRep
  return (step.reps ?? 0) * sides * perRep
}

/** Estimated total duration of a session in seconds, rounds and rests included. */
export function sessionSeconds(session: Session): number {
  const exercises = session.steps.filter((s) => s.kind === 'exercise')
  const work = exercises.reduce((sum, s) => sum + stepSeconds(s), 0)
  const transitions = exercises.length * GENERATOR_CONFIG.transitionSeconds
  const round = work + transitions + session.restSeconds
  return GENERATOR_CONFIG.warmupSeconds + GENERATOR_CONFIG.cooldownSeconds + round * session.rounds
}

/**
 * Muscle map of a whole session: union of the exercises' primaries; a muscle
 * that is primary anywhere stays primary even if secondary elsewhere.
 */
export function sessionMuscles(session: Session): MuscleUsage {
  const primary = new Set<MuscleGroupId>()
  const secondary = new Set<MuscleGroupId>()
  for (const step of session.steps) {
    if (step.kind !== 'exercise' || !step.exerciseId) continue
    const ex = EXERCISE_BY_ID[step.exerciseId]
    ex.primary.forEach((m) => primary.add(m))
    ex.secondary.forEach((m) => secondary.add(m))
  }
  primary.forEach((m) => secondary.delete(m))
  return { primary: [...primary], secondary: [...secondary] }
}

/** Human volume label for an exercise step: "15 reps", "8/côté", "40 s", "30 s/côté". */
export function stepVolumeLabel(step: SessionStep): string {
  if (step.kind !== 'exercise' || !step.exerciseId) return ''
  const ex = EXERCISE_BY_ID[step.exerciseId]
  if (step.seconds != null) return ex.unilateral ? `${step.seconds} s/côté` : `${step.seconds} s`
  return ex.unilateral ? `${step.reps}/côté` : `${step.reps} reps`
}

export function formatMinutes(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.round(totalSeconds % 60)
  return s === 0 ? `${m} min` : `${m} min ${s.toString().padStart(2, '0')}`
}

/** Builds the standard exercise step for a given exercise and volume. */
export function exerciseStep(ex: Exercise, volume: { reps?: number; seconds?: number }): SessionStep {
  return {
    kind: 'exercise',
    exerciseId: ex.id,
    reps: volume.reps,
    seconds: volume.seconds,
    label: shortLabel(ex),
  }
}

/** Short step names: watches truncate long labels. */
function shortLabel(ex: Exercise): string {
  const overrides: Record<string, string> = {
    kb_swing: 'Swings 2 mains',
    kb_swing_1b: 'Swing 1 bras',
    kb_deadlift: 'Soulevé de terre',
    kb_sdhp: 'Sumo DL high pull',
    kb_snatch: 'Snatch',
    goblet_squat: 'Goblet squat',
    kb_squat: 'Squat KB',
    rev_lunge: 'Fente arrière',
    kb_row: 'Rowing',
    kb_curl: 'Curl biceps',
    sa_press: 'Press unilatéral',
    floor_press: 'Floor press',
    kb_chest_press: 'Développé couché',
    half_tgu: 'Half get-up',
    tgu: 'Get-up complet',
    windmill: 'Windmill',
    kb_situp: 'Relevé de buste',
    farmer: 'Farmer carry',
    suitcase: 'Suitcase carry',
    waiter: 'Waiter carry',
  }
  return overrides[ex.id] ?? ex.nameFr
}

export const WARMUP_STEP: SessionStep = { kind: 'warmup', label: 'Échauffement' }
export const REST_STEP: SessionStep = { kind: 'rest', label: 'Repos' }
export const COOLDOWN_STEP: SessionStep = { kind: 'cooldown', label: 'Retour au calme' }
