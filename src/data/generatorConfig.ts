import type { Level } from './types'

/**
 * Tunable knobs of the session generator, kept apart from the algorithm
 * so pacing can be recalibrated without touching logic.
 */
export const GENERATOR_CONFIG = {
  /** Fixed session frame, seconds. */
  warmupSeconds: 240,
  cooldownSeconds: 180,
  restSeconds: 75,

  /** Time model used to size rounds. */
  secondsPerRep: 3,
  transitionSeconds: 15,

  /** Circuit size bounds. */
  minExercises: 4,
  maxExercises: 6,

  /** Accepted deviation from the requested duration. */
  durationTolerance: 0.1,

  /** Muscle groups targeted by the full-body shortcut (no manual selection). */
  fullBodyTargets: [
    'fessiers', 'ischios', 'quadriceps', 'dorsaux', 'epaules', 'abdominaux',
  ],

  /** Volume multiplier per level, applied to default reps and carry times. */
  levelVolume: {
    debutant: 0.8,
    intermediaire: 1.0,
    avance: 1.2,
  } satisfies Record<Level, number>,

  /** Levels unlocked per user level (an intermediate user draws deb + int). */
  levelPool: {
    debutant: ['debutant'],
    intermediaire: ['debutant', 'intermediaire'],
    avance: ['debutant', 'intermediaire', 'avance'],
  } satisfies Record<Level, Level[]>,
} as const

export const LEVEL_LABELS: Record<Level, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

/** Short level tag appended to exported workout names (watches truncate). */
export const LEVEL_TAGS: Record<Level, string> = {
  debutant: 'DEB',
  intermediaire: 'INT',
  avance: 'AV',
}
