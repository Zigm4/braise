import { Encoder, Profile } from '@garmin/fitsdk'
import { EXERCISE_BY_ID } from '../../data/exercises'
import { GENERATOR_CONFIG } from '../../data/generatorConfig'
import type { Session } from '../../data/types'
import { exportName } from '../generator'
import { warmupPlan } from '../warmup'

/**
 * Encodes a session as a Garmin FIT workout file (file type 5).
 *
 * Traps handled here, validated by the round-trip tests:
 * - time durations are in MILLISECONDS (240 s -> 240000);
 * - the repeat step's durationValue is the INDEX of the first repeated step;
 * - unilateral rep counts are doubled (the card shows "n/côté").
 */
export function encodeSessionToFit(session: Session, now: Date = new Date()): Uint8Array {
  const encoder = new Encoder()
  const cfg = GENERATOR_CONFIG
  // The SDK types each message strictly; semantic string enums and field
  // names are validated at encode time, so a wide cast is safe here.
  const writeMesg = encoder.writeMesg.bind(encoder) as (
    mesg: Record<string, unknown> & { mesgNum: number },
  ) => void

  writeMesg({
    mesgNum: Profile.MesgNum.FILE_ID,
    type: 'workout',
    manufacturer: 'development',
    product: 0,
    serialNumber: (now.getTime() / 1000) >>> 0,
    timeCreated: now,
  })

  interface StepMesg { [key: string]: unknown }
  const stepMesgs: StepMesg[] = []
  let firstExerciseIndex = -1

  for (const step of session.steps) {
    if (step.kind === 'warmup') {
      stepMesgs.push({
        intensity: 'warmup',
        durationType: 'time',
        durationValue: cfg.warmupSeconds * 1000,
        targetType: 'open',
        wktStepName: step.label,
        notes: warmupPlan(session).map((m) => m.nameFr).join(', '),
      })
    } else if (step.kind === 'exercise' && step.exerciseId) {
      const ex = EXERCISE_BY_ID[step.exerciseId]
      // Imported JSON may reference exercises this version does not know.
      if (!ex) continue
      if (firstExerciseIndex === -1) firstExerciseIndex = stepMesgs.length
      const sides = ex.unilateral ? 2 : 1
      const mesg: StepMesg = {
        intensity: 'active',
        targetType: 'open',
        wktStepName: step.label,
        notes: ex.cues[0],
        exerciseCategory: ex.fitCategory,
        exerciseName: ex.fitExercise,
      }
      if (step.seconds != null) {
        mesg.durationType = 'time'
        mesg.durationValue = step.seconds * sides * 1000
      } else {
        mesg.durationType = 'reps'
        mesg.durationValue = (step.reps ?? 0) * sides
      }
      if (session.weightKg != null) mesg.exerciseWeight = session.weightKg
      stepMesgs.push(mesg)
    } else if (step.kind === 'rest') {
      if (session.restSeconds > 0) {
        stepMesgs.push({
          intensity: 'rest',
          durationType: 'time',
          durationValue: session.restSeconds * 1000,
          targetType: 'open',
          wktStepName: step.label,
        })
      }
    } else if (step.kind === 'cooldown') {
      if (session.rounds > 1 && firstExerciseIndex >= 0) {
        stepMesgs.push({
          durationType: 'repeatUntilStepsCmplt',
          durationValue: firstExerciseIndex,
          targetType: 'open',
          targetValue: session.rounds,
        })
      }
      stepMesgs.push({
        intensity: 'cooldown',
        durationType: 'time',
        durationValue: cfg.cooldownSeconds * 1000,
        targetType: 'open',
        wktStepName: step.label,
      })
    }
  }

  writeMesg({
    mesgNum: Profile.MesgNum.WORKOUT,
    sport: 'training',
    subSport: 'strengthTraining',
    capabilities: 32,
    numValidSteps: stepMesgs.length,
    wktName: exportName(session),
  })

  stepMesgs.forEach((mesg, i) => {
    writeMesg({ mesgNum: Profile.MesgNum.WORKOUT_STEP, messageIndex: i, ...mesg })
  })

  return encoder.close()
}

/** Safe file name for the downloaded workout. */
export function fitFileName(session: Session): string {
  const slug = session.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `braise-${slug}.fit`
}

/** Triggers the browser download of the encoded workout. */
export function downloadFit(session: Session): void {
  const bytes = encodeSessionToFit(session)
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fitFileName(session)
  a.click()
  // iOS Safari resolves blob downloads asynchronously: defer the revoke.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
