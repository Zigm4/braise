import type { Session, SessionStep } from './types'
import { EXERCISE_BY_ID } from './exercises'
import { COOLDOWN_STEP, REST_STEP, WARMUP_STEP, exerciseStep } from '../lib/session'

function ex(id: string, volume: { reps?: number; seconds?: number }): SessionStep {
  return exerciseStep(EXERCISE_BY_ID[id], volume)
}

function circuit(steps: SessionStep[]): SessionStep[] {
  return [WARMUP_STEP, ...steps, REST_STEP, COOLDOWN_STEP]
}

/**
 * The 12 built-in routines. The nine Intégrales are 20-minute full-body
 * circuits, three variants per level. Volumes follow the same time model
 * as the generator (validated by tests/presets.test.ts).
 */
export const PRESETS: Session[] = [
  {
    id: 'integrale-1-1',
    name: 'Intégrale I.1 · Fondations',
    level: 'debutant', bells: 1, minutes: 20, rounds: 2, restSeconds: 75,
    steps: circuit([
      ex('kb_deadlift', { reps: 10 }),
      ex('goblet_squat', { reps: 10 }),
      ex('kb_row', { reps: 8 }),
      ex('floor_press', { reps: 8 }),
      ex('suitcase', { seconds: 30 }),
    ]),
  },
  {
    id: 'integrale-1-2',
    name: 'Intégrale I.2 · Élan',
    level: 'debutant', bells: 1, minutes: 20, rounds: 3, restSeconds: 75,
    steps: circuit([
      ex('kb_swing', { reps: 15 }),
      ex('kb_squat', { reps: 10 }),
      ex('kb_chest_press', { reps: 10 }),
      ex('kb_situp', { reps: 10 }),
    ]),
  },
  {
    id: 'integrale-1-3',
    name: 'Intégrale I.3 · Braise douce',
    level: 'debutant', bells: 1, minutes: 20, rounds: 2, restSeconds: 75,
    steps: circuit([
      ex('kb_swing', { reps: 15 }),
      ex('kb_row', { reps: 8 }),
      ex('goblet_squat', { reps: 12 }),
      ex('kb_situp', { reps: 12 }),
      ex('suitcase', { seconds: 30 }),
    ]),
  },
  {
    id: 'integrale-2-1',
    name: 'Intégrale II.1 · Braise complète',
    level: 'intermediaire', bells: 1, minutes: 20, rounds: 2, restSeconds: 75,
    steps: circuit([
      ex('kb_swing', { reps: 15 }),
      ex('goblet_squat', { reps: 10 }),
      ex('kb_row', { reps: 8 }),
      ex('sa_press', { reps: 8 }),
      ex('waiter', { seconds: 30 }),
    ]),
  },
  {
    id: 'integrale-2-2',
    name: 'Intégrale II.2 · Torrent',
    level: 'intermediaire', bells: 1, minutes: 20, rounds: 2, restSeconds: 75,
    steps: circuit([
      ex('kb_swing_1b', { reps: 10 }),
      ex('rev_lunge', { reps: 8 }),
      ex('kb_row', { reps: 8 }),
      ex('floor_press', { reps: 8 }),
      ex('kb_situp', { reps: 10 }),
    ]),
  },
  {
    id: 'integrale-2-3',
    name: 'Intégrale II.3 · Fonte vive',
    level: 'intermediaire', bells: 1, minutes: 20, rounds: 2, restSeconds: 75,
    steps: circuit([
      ex('kb_sdhp', { reps: 10 }),
      ex('kb_squat', { reps: 10 }),
      ex('sa_press', { reps: 8 }),
      ex('half_tgu', { reps: 3 }),
      ex('suitcase', { seconds: 30 }),
    ]),
  },
  {
    id: 'integrale-3-1',
    name: 'Intégrale III.1 · Grand feu',
    level: 'avance', bells: 1, minutes: 20, rounds: 2, restSeconds: 75,
    steps: circuit([
      ex('kb_snatch', { reps: 6 }),
      ex('goblet_squat', { reps: 12 }),
      ex('sa_press', { reps: 8 }),
      ex('kb_row', { reps: 8 }),
      ex('windmill', { reps: 5 }),
    ]),
  },
  {
    id: 'integrale-3-2',
    name: 'Intégrale III.2 · Enclume',
    level: 'avance', bells: 1, minutes: 20, rounds: 2, restSeconds: 75,
    steps: circuit([
      ex('kb_swing', { reps: 20 }),
      ex('rev_lunge', { reps: 8 }),
      ex('tgu', { reps: 2 }),
      ex('kb_sdhp', { reps: 10 }),
    ]),
  },
  {
    id: 'integrale-3-3',
    name: 'Intégrale III.3 · Coulée',
    level: 'avance', bells: 1, minutes: 20, rounds: 2, restSeconds: 75,
    steps: circuit([
      ex('kb_swing_1b', { reps: 10 }),
      ex('kb_squat', { reps: 12 }),
      ex('waiter', { seconds: 30 }),
      ex('floor_press', { reps: 8 }),
      ex('windmill', { reps: 5 }),
    ]),
  },
  {
    id: 'double-fonte',
    name: 'Double Fonte · Force',
    level: 'intermediaire', bells: 2, minutes: 30, rounds: 4, restSeconds: 75,
    steps: circuit([
      ex('kb_deadlift', { reps: 10 }),
      ex('kb_squat', { reps: 10 }),
      ex('kb_chest_press', { reps: 10 }),
      ex('kb_row', { reps: 8 }),
      ex('farmer', { seconds: 40 }),
    ]),
  },
  {
    id: 'emom-swing-snatch',
    name: 'EMOM Swing et Snatch',
    level: 'avance', bells: 1, minutes: 20, rounds: 6, restSeconds: 0,
    steps: [
      WARMUP_STEP,
      { kind: 'exercise', exerciseId: 'kb_swing', seconds: 60, label: 'Minute swings' },
      { kind: 'exercise', exerciseId: 'kb_snatch', seconds: 30, label: 'Minute snatch' },
      REST_STEP,
      COOLDOWN_STEP,
    ],
  },
  {
    id: 'core-express',
    name: 'Core Express',
    level: 'debutant', bells: 1, minutes: 15, rounds: 2, restSeconds: 75,
    steps: circuit([
      ex('kb_situp', { reps: 12 }),
      ex('suitcase', { seconds: 25 }),
      ex('kb_swing', { reps: 12 }),
    ]),
  },
]

export const PRESET_BY_ID: Record<string, Session> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p]),
)
