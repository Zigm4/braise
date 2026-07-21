import { EXERCISE_BY_ID } from '../data/exercises'
import type { Session, SessionStep } from '../data/types'

const KEY = 'braise:sessions'

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isSession) : []
  } catch {
    return []
  }
}

function persist(sessions: Session[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions))
  } catch {
    // Storage full or unavailable: the in-memory list still works.
  }
}

export function saveSession(session: Session): Session[] {
  const sessions = loadSessions().filter((s) => s.id !== session.id)
  const stamped = { ...session, createdAt: session.createdAt ?? new Date().toISOString() }
  const next = [stamped, ...sessions]
  persist(next)
  return next
}

export function renameSession(id: string, name: string): Session[] {
  const next = loadSessions().map((s) => (s.id === id ? { ...s, name } : s))
  persist(next)
  return next
}

export function deleteSession(id: string): Session[] {
  const next = loadSessions().filter((s) => s.id !== id)
  persist(next)
  return next
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  if (
    typeof s.id !== 'string' ||
    typeof s.name !== 'string' ||
    typeof s.rounds !== 'number' ||
    !Array.isArray(s.steps)
  ) {
    return false
  }
  // Every exercise step must reference an exercise this version knows,
  // otherwise the FIT encoder and the session card have nothing to show.
  return (s.steps as SessionStep[]).every(
    (step) =>
      typeof step === 'object' &&
      step !== null &&
      (step.kind !== 'exercise' || (typeof step.exerciseId === 'string' && step.exerciseId in EXERCISE_BY_ID)),
  )
}

export function exportSessionsJson(sessions: Session[]): void {
  const blob = new Blob([JSON.stringify({ app: 'braise', version: 1, sessions }, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'braise-seances.json'
  a.click()
  // iOS Safari resolves blob downloads asynchronously: defer the revoke.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function importSessionsJson(file: File): Promise<Session[]> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  const incoming: unknown[] = Array.isArray(parsed) ? parsed : (parsed?.sessions ?? [])
  const valid = incoming.filter(isSession)
  if (valid.length === 0) throw new Error('Aucune séance valide dans ce fichier.')
  let sessions = loadSessions()
  for (const session of valid) {
    sessions = sessions.filter((s) => s.id !== session.id)
    sessions = [session, ...sessions]
  }
  persist(sessions)
  return sessions
}
