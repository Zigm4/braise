import { useRef, useState } from 'react'
import { PRESETS } from '../../data/presets'
import { LEVEL_LABELS } from '../../data/generatorConfig'
import type { Level, Session } from '../../data/types'
import {
  deleteSession,
  exportSessionsJson,
  importSessionsJson,
  renameSession,
} from '../../lib/storage'

interface PresetGalleryProps {
  saved: Session[]
  onSavedChange: (sessions: Session[]) => void
  onOpen: (session: Session) => void
}

function PresetCard({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const exercises = session.steps.filter((s) => s.kind === 'exercise').length
  return (
    <button className="card p-4 text-left hover:border-[var(--steel)] transition-colors" onClick={onOpen}>
      <p className="font-display text-lg leading-tight">{session.name}</p>
      <p className="font-mono text-xs mt-2" style={{ color: 'var(--ink-muted)' }}>
        {session.minutes} min · {session.bells} KB · {exercises} exercices · {LEVEL_LABELS[session.level]}
      </p>
    </button>
  )
}

export function PresetGallery({ saved, onSavedChange, onOpen }: PresetGalleryProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const integrales = PRESETS.filter((p) => p.id.startsWith('integrale-'))
  const specials = PRESETS.filter((p) => !p.id.startsWith('integrale-'))
  const levels: Level[] = ['debutant', 'intermediaire', 'avance']

  const handleImport = async (file: File) => {
    setImportError(null)
    try {
      onSavedChange(await importSessionsJson(file))
    } catch {
      setImportError('Import impossible : fichier invalide.')
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="eyebrow mb-1">Routines intégrales · 20 min full body</h2>
        {levels.map((level) => (
          <div key={level} className="mt-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink-muted)' }}>
              {LEVEL_LABELS[level]}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {integrales
                .filter((p) => p.level === level)
                .map((p) => (
                  <PresetCard key={p.id} session={p} onOpen={() => onOpen(p)} />
                ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="eyebrow mb-3">Routines spéciales</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {specials.map((p) => (
            <PresetCard key={p.id} session={p} onOpen={() => onOpen(p)} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="eyebrow">Mes séances</h2>
          <div className="flex gap-2">
            <button
              className="btn ghost"
              onClick={() => exportSessionsJson(saved)}
              disabled={saved.length === 0}
            >
              Exporter JSON
            </button>
            <button className="btn ghost" onClick={() => fileRef.current?.click()}>
              Importer JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImport(file)
                e.target.value = ''
              }}
            />
          </div>
        </div>
        {importError && (
          <p className="text-sm mb-3" role="alert" style={{ color: '#ff6a5e' }}>{importError}</p>
        )}
        {saved.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            Aucune séance sauvegardée pour l'instant. Forge une séance puis sauvegarde-la ici.
          </p>
        ) : (
          <ul className="space-y-2">
            {saved.map((s) => (
              <li key={s.id} className="card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <button className="text-left font-medium" onClick={() => onOpen(s)}>
                  {s.name}
                  <span className="font-mono text-xs ml-3" style={{ color: 'var(--ink-muted)' }}>
                    {s.minutes} min · {LEVEL_LABELS[s.level]}
                  </span>
                </button>
                <div className="flex gap-2">
                  <button
                    className="btn ghost"
                    onClick={() => {
                      const name = prompt('Nouveau nom de la séance :', s.name)
                      if (name?.trim()) onSavedChange(renameSession(s.id, name.trim()))
                    }}
                  >
                    Renommer
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => {
                      if (confirm(`Supprimer « ${s.name} » ?`)) onSavedChange(deleteSession(s.id))
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
