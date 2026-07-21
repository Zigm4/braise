import { useEffect, useState } from 'react'
import { GarminGuide } from './components/GarminGuide/GarminGuide'
import { PresetGallery } from './components/PresetGallery/PresetGallery'
import { SessionBuilder } from './components/SessionBuilder/SessionBuilder'
import { SessionCard } from './components/SessionCard/SessionCard'
import { ThemePicker } from './components/ThemePicker/ThemePicker'
import type { Session } from './data/types'
import { generateSession } from './lib/generator'
import { loadSessions, saveSession } from './lib/storage'
import { applyTheme, loadThemeId } from './themes'

type View = 'forge' | 'seance' | 'routines' | 'guide'

const VIEW_HASH: Record<View, string> = {
  forge: '#/',
  seance: '#/seance',
  routines: '#/routines',
  guide: '#/guide',
}

function viewFromHash(hash: string): View {
  if (hash.startsWith('#/routines')) return 'routines'
  if (hash.startsWith('#/guide')) return 'guide'
  if (hash.startsWith('#/seance')) return 'seance'
  return 'forge'
}

export default function App() {
  const [view, setView] = useState<View>(() => viewFromHash(window.location.hash))
  const [session, setSession] = useState<Session | null>(null)
  const [saved, setSaved] = useState<Session[]>(() => loadSessions())
  const [themeId, setThemeId] = useState(() => loadThemeId())

  useEffect(() => {
    const onHash = () => setView(viewFromHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (v: View) => {
    window.location.hash = VIEW_HASH[v]
    setView(v)
  }

  const openSession = (s: Session) => {
    setSession(s)
    go('seance')
  }

  const variante = () => {
    if (!session?.seed) return
    const next = generateSession({
      targets: session.targets ?? [],
      minutes: session.minutes,
      bells: session.bells,
      level: session.level,
      seed: (Math.random() * 2 ** 31) | 0,
      weightKg: session.weightKg,
      double: session.double,
    })
    setSession({ ...next, name: session.name })
  }

  const changeTheme = (id: string) => {
    applyTheme(id)
    setThemeId(id)
  }

  const isSaved = session != null && saved.some((s) => s.id === session.id)

  const navBtn = (v: View, label: string) => (
    <button
      className="seg-nav"
      aria-current={view === v ? 'page' : undefined}
      style={{
        background: 'none',
        border: 0,
        cursor: 'pointer',
        font: '600 14px/1 var(--font-body)',
        color: view === v ? 'var(--ember-core)' : 'var(--ink-muted)',
        padding: '8px 2px',
        borderBottom: view === v ? '2px solid var(--ember)' : '2px solid transparent',
      }}
      onClick={() => go(v)}
    >
      {label}
    </button>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16 pt-6 sm:pt-10">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          onClick={() => go('forge')}
          className="font-display text-2xl tracking-tight"
          style={{ background: 'none', border: 0, color: 'var(--ink)', cursor: 'pointer' }}
        >
          Braise<span style={{ color: 'var(--ember)' }}>.</span>
        </button>
        <nav className="flex items-center gap-5" aria-label="Navigation principale">
          {navBtn('forge', 'Forger')}
          {navBtn('routines', 'Routines')}
          {navBtn('guide', 'Guide')}
        </nav>
        <ThemePicker themeId={themeId} onChange={changeTheme} />
      </header>

      {view === 'forge' && (
        <>
          <div className="text-center mb-6">
            <p className="eyebrow mb-2">Séances kettlebell</p>
            <h1 className="font-display text-3xl sm:text-4xl" style={{ textWrap: 'balance' }}>
              Choisis tes muscles, forge ta séance
            </h1>
          </div>
          <SessionBuilder onGenerated={openSession} />
        </>
      )}

      {view === 'seance' && <h1 className="sr-only">Séance</h1>}
      {view === 'routines' && <h1 className="sr-only">Routines et séances sauvegardées</h1>}
      {view === 'guide' && <h1 className="sr-only">Guide Garmin, Strava et Apple Watch</h1>}

      {view === 'seance' &&
        (session ? (
          <SessionCard
            session={session}
            saved={isSaved}
            onVariante={session.seed != null ? variante : undefined}
            onSave={() => setSaved(saveSession(session))}
            onOpenGuide={() => go('guide')}
          />
        ) : (
          <p className="text-center" style={{ color: 'var(--ink-muted)' }}>
            Aucune séance ouverte. Forge une séance ou choisis une routine.
          </p>
        ))}

      {view === 'routines' && (
        <PresetGallery saved={saved} onSavedChange={setSaved} onOpen={openSession} />
      )}

      {view === 'guide' && <GarminGuide />}

      <footer className="mt-14 text-center font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
        Braise · zéro compte, zéro tracking · tes séances restent sur cet appareil
      </footer>
    </div>
  )
}
