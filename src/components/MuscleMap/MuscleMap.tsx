import { useEffect, useMemo, useRef, useState } from 'react'
import { MUSCLE_SHAPES } from '../../data/muscleShapes'
import { MUSCLE_LABELS } from '../../data/muscles'
import type { FigureShapes, MuscleGroupId, MuscleUsage } from '../../data/types'

type MapMode = 'select' | 'visu'

interface MuscleMapProps {
  mode: MapMode
  selected?: Set<MuscleGroupId>
  onToggle?: (group: MuscleGroupId) => void
  usage?: MuscleUsage
  /** Bump to replay the staggered ignition. */
  igniteKey?: number
}

/** Order used for the ember ignition sequence: primaries first. */
function igniteOrder(usage: MuscleUsage): MuscleGroupId[] {
  return [...usage.primary, ...usage.secondary]
}

function Figure({
  shapes,
  figureId,
  mode,
  selected,
  onToggle,
  usage,
  lit,
  delays,
}: {
  shapes: FigureShapes
  figureId: string
  mode: MapMode
  selected: Set<MuscleGroupId>
  onToggle?: (group: MuscleGroupId) => void
  usage?: MuscleUsage
  lit: boolean
  delays: Map<MuscleGroupId, number>
}) {
  const groups = Object.entries(shapes.groups) as [MuscleGroupId, string[]][]
  return (
    <svg viewBox={shapes.viewBox} role="group" aria-label={figureId === 'face' ? 'Silhouette de face' : 'Silhouette de dos'} className="w-full h-auto block">
      {figureId === 'face' && (
        <defs>
          <radialGradient id="emberHot" cx="0.4" cy="0.35" r="0.85">
            <stop offset="0%" stopColor="var(--ember-core)" />
            <stop offset="55%" stopColor="var(--ember)" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--ember) 78%, #7a2d05)" />
          </radialGradient>
          <radialGradient id="emberDeep" cx="0.4" cy="0.35" r="0.9">
            <stop offset="0%" stopColor="color-mix(in srgb, var(--ember-deep) 78%, var(--ember))" />
            <stop offset="100%" stopColor="var(--ember-deep)" />
          </radialGradient>
        </defs>
      )}
      {shapes.body.map((d, i) => (
        <path key={i} d={d} fill="#1a1a1e" stroke="#8f8f96" strokeWidth={2.6} />
      ))}
      {groups.map(([group, paths]) => {
        const isPrimary = usage?.primary.includes(group)
        const isSecondary = usage?.secondary.includes(group)
        const cls = [
          'muscle',
          mode === 'select' && selected.has(group) ? 'selected' : '',
          mode === 'visu' && isPrimary ? 'primary' : '',
          mode === 'visu' && isSecondary ? 'secondary' : '',
          mode === 'visu' && (isPrimary || isSecondary) && !lit ? 'unlit' : '',
        ]
          .filter(Boolean)
          .join(' ')
        const interactive = mode === 'select' && onToggle
        return (
          <g
            key={group}
            className={cls}
            data-group={group}
            style={{ transitionDelay: lit ? `${delays.get(group) ?? 0}ms` : undefined }}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? 'button' : undefined}
            aria-pressed={interactive ? selected.has(group) : undefined}
            aria-label={MUSCLE_LABELS[group]}
            onClick={interactive ? () => onToggle(group) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onToggle(group)
                    }
                  }
                : undefined
            }
          >
            <title>{MUSCLE_LABELS[group]}</title>
            {paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

/**
 * The signature element: both silhouettes side by side on desktop, an
 * animated face/dos toggle on mobile. Selection mode toggles groups;
 * visualization mode ignites the session's muscles ember by ember.
 */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function MuscleMap({ mode, selected, onToggle, usage, igniteKey = 0 }: MuscleMapProps) {
  const reduced = useReducedMotion()
  const [mobileFigure, setMobileFigure] = useState<'face' | 'dos'>('face')
  const [lit, setLit] = useState(false)
  const litTimer = useRef<number>(0)

  const delays = useMemo(() => {
    const map = new Map<MuscleGroupId, number>()
    if (usage && !reduced) {
      igniteOrder(usage).forEach((g, i) => map.set(g, 120 + i * 110))
    }
    return map
  }, [usage, reduced])

  useEffect(() => {
    if (mode !== 'visu') return
    setLit(false)
    cancelAnimationFrame(litTimer.current)
    litTimer.current = requestAnimationFrame(() => {
      litTimer.current = requestAnimationFrame(() => setLit(true))
    })
    return () => cancelAnimationFrame(litTimer.current)
  }, [mode, igniteKey, usage])

  const sel = selected ?? new Set<MuscleGroupId>()
  const figure = (id: 'face' | 'dos') => (
    <Figure
      shapes={id === 'face' ? MUSCLE_SHAPES.face : MUSCLE_SHAPES.dos}
      figureId={id}
      mode={mode}
      selected={sel}
      onToggle={onToggle}
      usage={usage}
      lit={mode === 'select' || lit}
      delays={delays}
    />
  )

  return (
    <div className={mode === 'select' ? 'map-select' : ''}>
      {/* Desktop: both figures side by side. */}
      <div className="hidden sm:flex justify-center gap-8">
        <div className="flex-1 max-w-[300px]">
          {figure('face')}
          <p className="font-mono text-[11px] tracking-[0.42em] text-center mt-2 uppercase" style={{ color: 'var(--steel)' }}>Face</p>
        </div>
        <div className="flex-1 max-w-[300px]">
          {figure('dos')}
          <p className="font-mono text-[11px] tracking-[0.42em] text-center mt-2 uppercase" style={{ color: 'var(--steel)' }}>Dos</p>
        </div>
      </div>

      {/* Mobile: animated crossfade between face and dos. */}
      <div className="sm:hidden">
        <div className="flex justify-center mb-3">
          <div className="seg" role="group" aria-label="Face ou dos">
            <button aria-pressed={mobileFigure === 'face'} onClick={() => setMobileFigure('face')}>Face</button>
            <button aria-pressed={mobileFigure === 'dos'} onClick={() => setMobileFigure('dos')}>Dos</button>
          </div>
        </div>
        <div className="relative max-w-[280px] mx-auto" style={{ perspective: '900px' }}>
          {(['face', 'dos'] as const).map((id) => {
            const active = mobileFigure === id
            return (
              <div
                key={id}
                aria-hidden={!active}
                inert={!active}
                className={`fig-swap ${active ? 'relative' : 'absolute inset-0 pointer-events-none'}`}
                style={{
                  opacity: active ? 1 : 0,
                  transform: active || reduced ? 'none' : 'rotateY(-16deg) scale(0.97)',
                }}
              >
                {figure(id)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
