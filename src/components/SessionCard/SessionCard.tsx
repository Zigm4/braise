import { useMemo, useState } from 'react'
import { EXERCISE_BY_ID } from '../../data/exercises'
import { GENERATOR_CONFIG, LEVEL_LABELS } from '../../data/generatorConfig'
import type { Exercise, Session } from '../../data/types'
import { exportSessionPng } from '../../lib/pngExport'
import { formatMinutes, sessionMuscles, sessionSeconds, stepVolumeLabel } from '../../lib/session'
import { ExerciseSheet } from '../ExerciseSheet/ExerciseSheet'
import { MuscleMap } from '../MuscleMap/MuscleMap'

interface SessionCardProps {
  session: Session
  saved?: boolean
  onVariante?: () => void
  onSave?: () => void
  onOpenGuide: () => void
}

export function SessionCard({ session, saved, onVariante, onSave, onOpenGuide }: SessionCardProps) {
  const [igniteKey, setIgniteKey] = useState(0)
  const [sheet, setSheet] = useState<Exercise | null>(null)
  const [exporting, setExporting] = useState(false)
  const [fitLoading, setFitLoading] = useState(false)
  const usage = useMemo(() => sessionMuscles(session), [session])
  const total = sessionSeconds(session)

  const exportPng = async () => {
    setExporting(true)
    try {
      await exportSessionPng(session)
    } finally {
      setExporting(false)
    }
  }

  // The FIT SDK carries the full Garmin profile: load it only on demand.
  const exportFit = async () => {
    setFitLoading(true)
    try {
      const { downloadFit } = await import('../../lib/fit/encoder')
      downloadFit(session)
    } finally {
      setFitLoading(false)
    }
  }

  return (
    <section className="card p-5 sm:p-7">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl">{session.name}</h2>
          <p className="font-mono text-xs mt-2" style={{ color: 'var(--ink-muted)' }}>
            {LEVEL_LABELS[session.level]} · {session.bells} KB
            {session.double ? ' · double' : ''}
            {session.weightKg ? ` · ${session.weightKg} kg` : ''} · environ {formatMinutes(total)}
          </p>
        </div>
        <button className="btn ghost" onClick={() => setIgniteKey((k) => k + 1)}>
          Rejouer l'allumage
        </button>
      </header>

      <div className="mt-6">
        <MuscleMap mode="visu" usage={usage} igniteKey={igniteKey} />
      </div>

      <ol className="mt-6 space-y-1">
        <li className="flex justify-between px-3 py-2 rounded-lg" style={{ color: 'var(--ink-muted)' }}>
          <span>Échauffement</span>
          <span className="font-mono text-sm">{formatMinutes(GENERATOR_CONFIG.warmupSeconds)}</span>
        </li>
        {session.steps.map((step, i) => {
          if (step.kind !== 'exercise' || !step.exerciseId) return null
          const ex = EXERCISE_BY_ID[step.exerciseId]
          return (
            <li key={i}>
              <button
                className="w-full flex justify-between items-center px-3 py-2 rounded-lg text-left transition-colors"
                style={{ background: 'var(--surface-2)' }}
                onClick={() => setSheet(ex)}
                title="Voir la fiche exercice"
              >
                <span>{ex.nameFr}</span>
                <span className="font-mono text-sm" style={{ color: 'var(--ember-core)' }}>
                  {stepVolumeLabel(step)}
                </span>
              </button>
            </li>
          )
        })}
        {session.restSeconds > 0 && (
          <li className="flex justify-between px-3 py-2" style={{ color: 'var(--ink-muted)' }}>
            <span>Repos entre les tours</span>
            <span className="font-mono text-sm">{session.restSeconds} s</span>
          </li>
        )}
        <li className="flex justify-between px-3 py-2" style={{ color: 'var(--ember-core)' }}>
          <span className="font-semibold">Tours</span>
          <span className="font-mono text-sm">x{session.rounds}</span>
        </li>
        <li className="flex justify-between px-3 py-2" style={{ color: 'var(--ink-muted)' }}>
          <span>Retour au calme</span>
          <span className="font-mono text-sm">{formatMinutes(GENERATOR_CONFIG.cooldownSeconds)}</span>
        </li>
      </ol>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn primary" onClick={exportFit} disabled={fitLoading}>
          {fitLoading ? 'Préparation' : 'Télécharger le .FIT'}
        </button>
        <button className="btn" onClick={exportPng} disabled={exporting}>
          {exporting ? 'Export en cours' : 'Exporter en image'}
        </button>
        {onVariante && (
          <button className="btn" onClick={onVariante}>
            Variante
          </button>
        )}
        {onSave && (
          <button className="btn" onClick={onSave} disabled={saved}>
            {saved ? 'Sauvegardée' : 'Sauvegarder'}
          </button>
        )}
        <button className="btn ghost" onClick={onOpenGuide}>
          Guide Garmin
        </button>
      </div>

      {sheet && <ExerciseSheet exercise={sheet} onClose={() => setSheet(null)} />}
    </section>
  )
}
