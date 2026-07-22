import type { MuscleGroupId } from './types'

export interface WarmupMove {
  id: string
  nameFr: string
  /** Muscle groups this movement prepares. */
  targets: MuscleGroupId[]
  /** One-line French cue. */
  cue: string
}

/**
 * Warmup pool: no equipment or a light bell, 60 seconds per move.
 * Every one of the 15 muscle groups is reachable by at least one move.
 */
export const WARMUP_MOVES: WarmupMove[] = [
  {
    id: 'halo',
    nameFr: 'Halos autour de la tête',
    targets: ['epaules', 'trapezes', 'abdominaux'],
    cue: 'Cloche légère qui tourne autour de la tête, lent, dans les deux sens.',
  },
  {
    id: 'good_morning',
    nameFr: 'Good mornings à vide',
    targets: ['ischios', 'lombaires', 'fessiers'],
    cue: 'Mains derrière la tête, charnière de hanches lente, dos plat.',
  },
  {
    id: 'deep_squat_pry',
    nameFr: 'Squat profond tenu',
    targets: ['quadriceps', 'adducteurs', 'fessiers'],
    cue: 'Descends au fond, coudes qui écartent les genoux, respire.',
  },
  {
    id: 'hip_circles',
    nameFr: 'Cercles de bassin',
    targets: ['fessiers', 'lombaires', 'obliques'],
    cue: 'Grands cercles amples, dans les deux sens.',
  },
  {
    id: 'scap_pushup',
    nameFr: 'Pompes scapulaires',
    targets: ['pectoraux', 'epaules', 'dorsaux'],
    cue: 'Bras tendus, seules les omoplates bougent.',
  },
  {
    id: 'superman',
    nameFr: 'Superman au sol',
    targets: ['lombaires', 'dorsaux', 'fessiers'],
    cue: 'Décolle bras et jambes, tiens 2 secondes, redescends.',
  },
  {
    id: 'dead_bug',
    nameFr: 'Dead bugs',
    targets: ['abdominaux', 'obliques'],
    cue: 'Dos plaqué au sol, bras et jambe opposés qui descendent.',
  },
  {
    id: 'dyn_lunges',
    nameFr: 'Fentes dynamiques',
    targets: ['quadriceps', 'fessiers', 'adducteurs'],
    cue: 'Fentes alternées sans charge, buste fier.',
  },
  {
    id: 'arm_circles',
    nameFr: 'Grands cercles de bras',
    targets: ['epaules', 'pectoraux', 'biceps', 'triceps'],
    cue: 'Amplitude maximale, vitesse progressive.',
  },
  {
    id: 'calf_raises',
    nameFr: 'Montées sur pointes',
    targets: ['mollets'],
    cue: 'Monte haut, redescends en 2 secondes.',
  },
  {
    id: 'wrist_rolls',
    nameFr: 'Cercles de poignets',
    targets: ['avant_bras'],
    cue: 'Poignets souples, doigts qui s\'ouvrent et se ferment.',
  },
]
