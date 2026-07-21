import { useState } from 'react'
import { MUSCLE_LABELS } from '../../data/muscles'
import { LEVEL_LABELS } from '../../data/generatorConfig'
import type { Level, MuscleGroupId, Session } from '../../data/types'
import { generateSession } from '../../lib/generator'
import { MuscleMap } from '../MuscleMap/MuscleMap'

interface SessionBuilderProps {
  onGenerated: (session: Session) => void
}

const WEIGHTS = [8, 10, 12, 14, 16, 20, 24, 28, 32]

/** Home screen: the interactive map plus the generation controls. */
export function SessionBuilder({ onGenerated }: SessionBuilderProps) {
  const [targets, setTargets] = useState<Set<MuscleGroupId>>(new Set())
  const [minutes, setMinutes] = useState<20 | 30 | 40>(20)
  const [bells, setBells] = useState<1 | 2>(1)
  const [level, setLevel] = useState<Level>('intermediaire')
  const [weightKg, setWeightKg] = useState<number | undefined>(undefined)
  const [double, setDouble] = useState(false)

  const toggle = (group: MuscleGroupId) => {
    setTargets((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const forge = (fullBody: boolean) => {
    const session = generateSession({
      targets: fullBody ? [] : [...targets],
      minutes,
      bells,
      level,
      seed: (Math.random() * 2 ** 31) | 0,
      weightKg,
      double: bells === 2 ? double : false,
    })
    onGenerated(session)
  }

  return (
    <section>
      <MuscleMap mode="select" selected={targets} onToggle={toggle} />

      <div className="mt-4 min-h-9 flex flex-wrap justify-center gap-2" aria-live="polite">
        {targets.size === 0 ? (
          <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            Choisis les muscles à travailler, ou pars sur un full body
          </span>
        ) : (
          [...targets].map((g) => (
            <button
              key={g}
              className="chip"
              onClick={() => toggle(g)}
              aria-label={`Retirer ${MUSCLE_LABELS[g]}`}
            >
              {MUSCLE_LABELS[g]} <span aria-hidden="true">×</span>
            </button>
          ))
        )}
      </div>

      <div className="card mt-5 p-5 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Durée</span>
          <div className="seg" role="group" aria-label="Durée">
            {([20, 30, 40] as const).map((m) => (
              <button key={m} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
                {m} min
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Kettlebells</span>
          <div className="seg" role="group" aria-label="Nombre de kettlebells">
            {([1, 2] as const).map((b) => (
              <button key={b} aria-pressed={bells === b} onClick={() => setBells(b)}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium" htmlFor="level">Niveau</label>
          <select id="level" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            {Object.entries(LEVEL_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium" htmlFor="weight">Poids</label>
          <div className="flex items-center gap-3">
            <select
              id="weight"
              value={weightKg ?? ''}
              onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Sans poids</option>
              {WEIGHTS.map((w) => (
                <option key={w} value={w}>{w} kg</option>
              ))}
            </select>
            {bells === 2 && (
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-muted)' }}>
                <input
                  type="checkbox"
                  checked={double}
                  onChange={(e) => setDouble(e.target.checked)}
                />
                En double
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          className="btn primary text-base px-8 py-4"
          onClick={() => forge(false)}
          disabled={targets.size === 0}
        >
          Forger la séance
        </button>
        <button className="btn" onClick={() => forge(true)}>
          Full body direct
        </button>
      </div>
    </section>
  )
}
