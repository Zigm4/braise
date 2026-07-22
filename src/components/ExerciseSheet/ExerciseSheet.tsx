import { useEffect, useRef } from 'react'
import { EXERCISE_MEDIA } from '../../data/exerciseMedia'
import { MUSCLE_LABELS } from '../../data/muscles'
import type { Exercise } from '../../data/types'
import { MuscleMap } from '../MuscleMap/MuscleMap'

interface ExerciseSheetProps {
  exercise: Exercise
  onClose: () => void
}

/** Modal card with execution cues, the classic mistake and the Garmin name. */
export function ExerciseSheet({ exercise, onClose }: ExerciseSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const invoker = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Minimal focus trap: keep Tab cycling inside the dialog.
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      invoker?.focus()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={exercise.nameFr}
        className="card w-full sm:max-w-lg max-h-[88dvh] overflow-y-auto p-6 rounded-b-none sm:rounded-b-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">{exercise.nameFr}</h2>
            <p className="font-mono text-xs mt-2" style={{ color: 'var(--ink-muted)' }}>
              Garmin Connect : {exercise.garminName}
            </p>
          </div>
          <button ref={closeRef} className="btn ghost" onClick={onClose} aria-label="Fermer">
            Fermer
          </button>
        </div>

        {(() => {
          const media = EXERCISE_MEDIA[exercise.id]
          if (!media?.photos) return null
          return (
            <figure className="mt-5">
              <div className="grid grid-cols-2 gap-3">
                {media.photos.map((path, i) => (
                  <img
                    key={path}
                    src={`${import.meta.env.BASE_URL}${path}`}
                    alt={i === 0 ? 'Position de départ' : 'Position d\'arrivée'}
                    loading="lazy"
                    className="w-full rounded-xl"
                    style={{ border: '1px solid var(--line)', filter: 'saturate(0.9)' }}
                  />
                ))}
              </div>
              <figcaption className="font-mono text-[10px] mt-1" style={{ color: 'var(--ink-muted)' }}>
                Photos : free-exercise-db, domaine public
              </figcaption>
            </figure>
          )
        })()}

        <div className="mt-5 grid sm:grid-cols-[1fr_150px] gap-5 items-start">
          <div>
            <h3 className="eyebrow mb-3">Exécution</h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--ink)' }}>
              {exercise.cues.map((cue) => (
                <li key={cue} className="flex gap-2">
                  <span aria-hidden="true" style={{ color: 'var(--ember)' }}>·</span>
                  {cue}
                </li>
              ))}
            </ul>
            <h3 className="eyebrow mt-5 mb-2">Erreur fréquente</h3>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{exercise.mistake}</p>
            <p className="text-xs mt-4" style={{ color: 'var(--ink-muted)' }}>
              Principaux : {exercise.primary.map((m) => MUSCLE_LABELS[m]).join(', ')}
              <br />
              Secondaires : {exercise.secondary.map((m) => MUSCLE_LABELS[m]).join(', ')}
            </p>
            {EXERCISE_MEDIA[exercise.id]?.videoUrl && (
              <a
                className="btn ghost inline-block mt-4"
                href={EXERCISE_MEDIA[exercise.id].videoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Voir la vidéo <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
          <div className="hidden sm:block">
            <MuscleMap
              mode="visu"
              usage={{ primary: exercise.primary, secondary: exercise.secondary }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
