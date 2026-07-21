export type MuscleGroupId =
  | 'trapezes' | 'epaules' | 'pectoraux' | 'biceps' | 'triceps'
  | 'avant_bras' | 'abdominaux' | 'obliques' | 'dorsaux' | 'lombaires'
  | 'fessiers' | 'adducteurs' | 'quadriceps' | 'ischios' | 'mollets'

export interface FigureShapes {
  viewBox: string
  body: string[]
  groups: Partial<Record<MuscleGroupId, string[]>>
}

export type Pattern = 'hinge' | 'squat' | 'poussee' | 'tirage' | 'port' | 'core'

export type Level = 'debutant' | 'intermediaire' | 'avance'

/** Which kettlebell setup an exercise supports: exactly one, exactly two, or either. */
export type Bells = 1 | 2 | 'both'

export interface Exercise {
  id: string
  nameFr: string
  /** Exact exercise name in Garmin Connect, for manual workout creation. */
  garminName: string
  fitCategory: number
  fitExercise: number
  pattern: Pattern
  /** The generator never schedules two heavy hinge exercises back to back. */
  heavyHinge?: boolean
  unilateral: boolean
  bells: Bells
  /** Minimum level required to draw this exercise in the generator. */
  level: Level
  /** Default volume: reps per side for unilateral exercises, total otherwise. */
  defaultReps?: number
  /** Seconds one rep takes; overrides the generator default for slow lifts. */
  repSeconds?: number
  /** Timed exercises (carries): seconds per side for unilateral ones. */
  defaultSeconds?: number
  primary: MuscleGroupId[]
  secondary: MuscleGroupId[]
  /** 3-4 execution cues, French. */
  cues: string[]
  /** The most frequent mistake, French. */
  mistake: string
}

export type StepKind = 'warmup' | 'exercise' | 'rest' | 'cooldown'

export interface SessionStep {
  kind: StepKind
  exerciseId?: string
  /** Reps per side for unilateral exercises (display shows "n/côté"). */
  reps?: number
  /** Seconds per side for unilateral timed exercises. */
  seconds?: number
  /** Short French step name, kept short because watches truncate long labels. */
  label: string
}

export interface Session {
  id: string
  name: string
  level: Level
  bells: 1 | 2
  /** Planned duration in minutes (20 / 30 / 40 style targets). */
  minutes: number
  rounds: number
  /** Rest between rounds, seconds. */
  restSeconds: number
  steps: SessionStep[]
  /** Optional per-session kettlebell weight in kg, written to the FIT file. */
  weightKg?: number
  /** True when both bells are used simultaneously (doubles the load). */
  double?: boolean
  /** Seed used by the generator, absent for hand-authored presets. */
  seed?: number
  /** Muscle targets the generator was asked for (empty = full body). */
  targets?: MuscleGroupId[]
  createdAt?: string
}

export interface MuscleUsage {
  primary: MuscleGroupId[]
  secondary: MuscleGroupId[]
}
