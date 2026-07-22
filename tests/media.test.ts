import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXERCISE_MEDIA } from '../src/data/exerciseMedia'
import { EXERCISE_BY_ID } from '../src/data/exercises'

describe('exercise media', () => {
  it('references known exercises only', () => {
    for (const id of Object.keys(EXERCISE_MEDIA)) {
      expect(EXERCISE_BY_ID[id], id).toBeDefined()
    }
  })

  it('ships every referenced photo in public/', () => {
    for (const [id, media] of Object.entries(EXERCISE_MEDIA)) {
      for (const photo of media.photos ?? []) {
        expect(existsSync(join(process.cwd(), 'public', photo)), `${id}: ${photo}`).toBe(true)
      }
    }
  })

  it('uses https links from the two validated video sources', () => {
    for (const [id, media] of Object.entries(EXERCISE_MEDIA)) {
      if (!media.videoUrl) continue
      expect(
        media.videoUrl.startsWith('https://musclewiki.com/') ||
          media.videoUrl.startsWith('https://kettlebellsworkouts.com/'),
        `${id}: ${media.videoUrl}`,
      ).toBe(true)
    }
  })

  it('covers most of the base with photos and videos', () => {
    const withPhotos = Object.values(EXERCISE_MEDIA).filter((m) => m.photos).length
    const withVideo = Object.values(EXERCISE_MEDIA).filter((m) => m.videoUrl).length
    expect(withPhotos).toBeGreaterThanOrEqual(25)
    expect(withVideo).toBeGreaterThanOrEqual(27)
  })
})
