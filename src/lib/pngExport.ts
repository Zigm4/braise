import { MUSCLE_SHAPES } from '../data/muscleShapes'
import { MUSCLE_LABELS } from '../data/muscles'
import { EXERCISE_BY_ID } from '../data/exercises'
import type { FigureShapes, MuscleGroupId, Session } from '../data/types'
import { sessionMuscles } from './session'

const W = 1200
const H = 1740

/**
 * Renders the shareable 1200x1740 card in the exact layout of the original
 * artwork: title, exercise list, both silhouettes with ember states, legend.
 * The traced paths are in the source image's coordinate space, so the
 * figures land pixel-perfect without any transform.
 */
export function buildSessionSvg(session: Session): string {
  const usage = sessionMuscles(session)
  const exercises = session.steps
    .filter((s) => s.kind === 'exercise' && s.exerciseId)
    .map((s) => EXERCISE_BY_ID[s.exerciseId!].nameFr)
  const primaryLabels = usage.primary.map((m) => MUSCLE_LABELS[m])

  const esc = (t: string) =>
    t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const figure = (shapes: FigureShapes) => {
    const parts: string[] = []
    for (const d of shapes.body) {
      parts.push(`<path d="${d}" fill="#1d1d1f" stroke="#9d9da3" stroke-width="2.6"/>`)
    }
    for (const [group, paths] of Object.entries(shapes.groups) as [MuscleGroupId, string[]][]) {
      const isPrimary = usage.primary.includes(group)
      const isSecondary = usage.secondary.includes(group)
      const fill = isPrimary ? 'url(#pngHot)' : isSecondary ? 'url(#pngDeep)' : '#2b2b2f'
      const stroke = isPrimary ? '#d96a12' : isSecondary ? '#6e3410' : '#3c3c42'
      const filter = isPrimary ? ' filter="url(#pngGlow)"' : ''
      for (const d of paths) {
        parts.push(`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"${filter}/>`)
      }
    }
    return parts.join('\n')
  }

  const title = esc(session.name.toUpperCase())
  const subtitle = esc(exercises.join(' · '))
  const info = esc(`${session.rounds} tours · ${primaryLabels.join(', ')}`)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="pngHot" cx="0.4" cy="0.35" r="0.85">
      <stop offset="0%" stop-color="#ffc46a"/>
      <stop offset="55%" stop-color="#ff8a1e"/>
      <stop offset="100%" stop-color="#d96a12"/>
    </radialGradient>
    <radialGradient id="pngDeep" cx="0.4" cy="0.35" r="0.9">
      <stop offset="0%" stop-color="#a5551a"/>
      <stop offset="100%" stop-color="#6e3410"/>
    </radialGradient>
    <filter id="pngGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="#ff8a1e" flood-opacity="0.55"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#212121"/>
  <text x="600" y="88" text-anchor="middle" fill="#f2f0ec" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="58" font-weight="800" letter-spacing="2">${title}</text>
  <text x="600" y="140" text-anchor="middle" fill="#9d9da3" font-family="Helvetica, Arial, sans-serif" font-size="33">${subtitle}</text>
  <text x="600" y="180" text-anchor="middle" fill="#7c7c82" font-family="Helvetica, Arial, sans-serif" font-size="27">${info}</text>
  ${figure(MUSCLE_SHAPES.face)}
  ${figure(MUSCLE_SHAPES.dos)}
  <text x="330" y="1608" text-anchor="middle" fill="#8b8b92" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="12">FACE</text>
  <text x="880" y="1608" text-anchor="middle" fill="#8b8b92" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="12">DOS</text>
  <circle cx="415" cy="1656" r="11" fill="url(#pngHot)"/>
  <text x="437" y="1664" fill="#c9c7c2" font-family="Helvetica, Arial, sans-serif" font-size="26">Sollicitation principale</text>
  <circle cx="742" cy="1656" r="11" fill="#8a4110"/>
  <text x="764" y="1664" fill="#c9c7c2" font-family="Helvetica, Arial, sans-serif" font-size="26">Secondaire</text>
</svg>`
}

export async function exportSessionPng(session: Session): Promise<void> {
  const svg = buildSessionSvg(session)
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Rendu SVG impossible'))
    img.src = svgUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, W, H)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export PNG impossible'))), 'image/png')
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `braise-${session.id}.png`
  a.click()
  URL.revokeObjectURL(url)
}
