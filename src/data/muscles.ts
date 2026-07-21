import type { MuscleGroupId } from './types'

export const MUSCLE_LABELS: Record<MuscleGroupId, string> = {
  trapezes: 'Trapèzes',
  epaules: 'Épaules',
  pectoraux: 'Pectoraux',
  biceps: 'Biceps',
  triceps: 'Triceps',
  avant_bras: 'Avant-bras',
  abdominaux: 'Abdominaux',
  obliques: 'Obliques',
  dorsaux: 'Dorsaux',
  lombaires: 'Lombaires',
  fessiers: 'Fessiers',
  adducteurs: 'Adducteurs',
  quadriceps: 'Quadriceps',
  ischios: 'Ischio-jambiers',
  mollets: 'Mollets',
}

export const MUSCLE_GROUPS = Object.keys(MUSCLE_LABELS) as MuscleGroupId[]

export const FACE_GROUPS: MuscleGroupId[] = [
  'trapezes', 'epaules', 'pectoraux', 'biceps', 'avant_bras',
  'abdominaux', 'obliques', 'quadriceps', 'adducteurs', 'mollets',
]

export const DOS_GROUPS: MuscleGroupId[] = [
  'trapezes', 'epaules', 'triceps', 'avant_bras', 'dorsaux',
  'lombaires', 'fessiers', 'ischios', 'mollets',
]
