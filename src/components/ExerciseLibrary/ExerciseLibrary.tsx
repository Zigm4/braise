import { useState } from 'react'
import { EXERCISES } from '../../data/exercises'
import { LEVEL_LABELS } from '../../data/generatorConfig'
import { MUSCLE_LABELS } from '../../data/muscles'
import { WARMUP_MOVES } from '../../data/warmups'
import type { Exercise, Pattern } from '../../data/types'
import { ExerciseSheet } from '../ExerciseSheet/ExerciseSheet'

const PATTERN_LABELS: Record<Pattern, string> = {
  hinge: 'Charnière de hanches',
  squat: 'Squat',
  poussee: 'Poussée',
  tirage: 'Tirage',
  port: 'Port',
  core: 'Gainage',
}

const PATTERN_ORDER: Pattern[] = ['hinge', 'squat', 'poussee', 'tirage', 'port', 'core']

function ExerciseCard({ exercise, onOpen }: { exercise: Exercise; onOpen: () => void }) {
  return (
    <button
      className="card p-4 text-left hover:border-[var(--steel)] transition-colors"
      onClick={onOpen}
      title="Voir la fiche complète"
    >
      <p className="font-display text-lg leading-tight">{exercise.nameFr}</p>
      <p className="font-mono text-xs mt-2" style={{ color: 'var(--ink-muted)' }}>
        {LEVEL_LABELS[exercise.level]}
        {exercise.unilateral ? ' · unilatéral' : ''}
        {exercise.bells === 2 ? ' · 2 KB' : ''}
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--ink-muted)' }}>
        {exercise.primary.map((m) => MUSCLE_LABELS[m]).join(', ')}
      </p>
    </button>
  )
}

/** The full movement library: every exercise sheet plus the warmup pool. */
export function ExerciseLibrary() {
  const [sheet, setSheet] = useState<Exercise | null>(null)

  return (
    <section className="space-y-8">
      <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--ink-muted)' }}>
        Tous les mouvements de Braise, classés par pattern. Tape une carte pour ouvrir la
        fiche complète : consignes d'exécution, erreur fréquente, muscles engagés et nom
        exact dans Garmin Connect. Ces mêmes fiches s'ouvrent depuis chaque exercice d'une
        séance.
      </p>

      {PATTERN_ORDER.map((pattern) => {
        const list = EXERCISES.filter((e) => e.pattern === pattern)
        if (list.length === 0) return null
        return (
          <div key={pattern}>
            <h2 className="eyebrow mb-3">{PATTERN_LABELS[pattern]}</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {list.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onOpen={() => setSheet(exercise)}
                />
              ))}
            </div>
          </div>
        )
      })}

      <div>
        <h2 className="eyebrow mb-3">Échauffements</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--ink-muted)' }}>
          Le bloc d'échauffement de chaque séance pioche 4 de ces mouvements, 60 secondes
          chacun, selon les muscles au programme.
        </p>
        <ul className="grid sm:grid-cols-2 gap-3">
          {WARMUP_MOVES.map((move) => (
            <li key={move.id} className="card p-4">
              <p className="font-medium">{move.nameFr}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>{move.cue}</p>
              <p className="font-mono text-xs mt-2" style={{ color: 'var(--ink-muted)' }}>
                {move.targets.map((m) => MUSCLE_LABELS[m]).join(', ')}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {sheet && <ExerciseSheet exercise={sheet} onClose={() => setSheet(null)} />}
    </section>
  )
}
