import { describe, expect, it } from 'vitest'
import { Decoder, Stream } from '@garmin/fitsdk'
import { encodeSessionToFit } from '../src/lib/fit/encoder'
import { PRESET_BY_ID, PRESETS } from '../src/data/presets'

function decode(bytes: Uint8Array) {
  const stream = Stream.fromByteArray(bytes)
  const decoder = new Decoder(stream)
  expect(decoder.isFIT()).toBe(true)
  expect(decoder.checkIntegrity()).toBe(true)
  const { messages, errors } = decoder.read()
  expect(errors).toEqual([])
  const { fileIdMesgs, workoutMesgs, workoutStepMesgs } = messages
  if (!fileIdMesgs || !workoutMesgs || !workoutStepMesgs) {
    throw new Error('decoded file is missing workout messages')
  }
  return { ...messages, fileIdMesgs, workoutMesgs, workoutStepMesgs }
}

describe('FIT encoder', () => {
  it('encodes Intégrale II.1 with the validated 9-step structure', () => {
    const session = PRESET_BY_ID['integrale-2-1']
    const messages = decode(encodeSessionToFit(session, new Date('2026-07-21T10:00:00Z')))

    expect(messages.fileIdMesgs[0].type).toBe('workout')
    expect(messages.fileIdMesgs[0].manufacturer).toBe('development')

    const workout = messages.workoutMesgs[0]
    expect(workout.sport).toBe('training')
    expect(workout.subSport).toBe('strengthTraining')
    expect(workout.numValidSteps).toBe(9)
    expect(workout.wktName).toBe('Braise · Intégrale II.1 · Braise complète · INT')

    const steps = messages.workoutStepMesgs
    expect(steps).toHaveLength(9)

    // Warmup: 240 s encoded in milliseconds.
    expect(steps[0].intensity).toBe('warmup')
    expect(steps[0].durationTime).toBe(240)

    // Exercises carry the verified Garmin ids.
    expect(steps[1].exerciseCategory).toBe('hipRaise')
    expect(steps[1].exerciseName).toBe(23)
    expect(steps[1].durationReps).toBe(15)

    expect(steps[2].exerciseCategory).toBe('squat')
    expect(steps[2].exerciseName).toBe(37)

    // Unilateral reps are doubled in the file (8/side -> 16).
    expect(steps[3].exerciseCategory).toBe('row')
    expect(steps[3].durationReps).toBe(16)

    expect(steps[4].exerciseCategory).toBe('shoulderPress')
    expect(steps[4].exerciseName).toBe(18)

    // Timed unilateral carry: 30 s/side -> 60 s total.
    expect(steps[5].exerciseCategory).toBe('carry')
    expect(steps[5].exerciseName).toBe(5)
    expect(steps[5].durationTime).toBe(60)

    expect(steps[6].intensity).toBe('rest')
    expect(steps[6].durationTime).toBe(75)

    // The loop points at the first exercise step and repeats the rounds.
    expect(steps[7].durationType).toBe('repeatUntilStepsCmplt')
    expect(steps[7].durationStep).toBe(1)
    expect(steps[7].repeatSteps).toBe(2)

    expect(steps[8].intensity).toBe('cooldown')
    expect(steps[8].durationTime).toBe(180)
  })

  it('encodes the EMOM without rest step and with 6 loops', () => {
    const messages = decode(encodeSessionToFit(PRESET_BY_ID['emom-swing-snatch']))
    const steps = messages.workoutStepMesgs
    expect(steps).toHaveLength(5)
    expect(steps.some((s) => s.intensity === 'rest')).toBe(false)
    expect(steps[1].durationTime).toBe(60)
    expect(steps[2].durationTime).toBe(60)
    expect(steps[3].durationStep).toBe(1)
    expect(steps[3].repeatSteps).toBe(6)
  })

  it('omits the repeat step for single-round sessions', () => {
    const session = { ...PRESET_BY_ID['core-express'], rounds: 1 }
    const messages = decode(encodeSessionToFit(session))
    const steps = messages.workoutStepMesgs
    expect(steps.some((s) => s.durationType === 'repeatUntilStepsCmplt')).toBe(false)
    expect(steps.some((s) => s.intensity === 'rest')).toBe(true)
    expect(messages.workoutMesgs[0].numValidSteps).toBe(steps.length)
  })

  it('writes the kettlebell weight when set', () => {
    const session = { ...PRESET_BY_ID['integrale-1-1'], weightKg: 16 }
    const messages = decode(encodeSessionToFit(session))
    const exercise = messages.workoutStepMesgs[1]
    expect(exercise.exerciseWeight).toBe(16)
  })

  it('round-trips the extension-batch exercises with their verified ids', () => {
    const session = {
      id: 'lot', name: 'Lot complet', level: 'avance' as const, bells: 2 as const,
      minutes: 20, rounds: 2, restSeconds: 75,
      steps: [
        { kind: 'warmup' as const, label: 'Échauffement' },
        { kind: 'exercise' as const, exerciseId: 'kb_clean', reps: 6, label: 'Clean' },
        { kind: 'exercise' as const, exerciseId: 'kb_thruster', reps: 8, label: 'Thruster' },
        { kind: 'exercise' as const, exerciseId: 'kb_flye', reps: 10, label: 'Écarté' },
        { kind: 'exercise' as const, exerciseId: 'overhead_carry', seconds: 25, label: 'Overhead carry' },
        { kind: 'rest' as const, label: 'Repos' },
        { kind: 'cooldown' as const, label: 'Retour au calme' },
      ],
    }
    const steps = decode(encodeSessionToFit(session)).workoutStepMesgs
    expect(steps[1].exerciseCategory).toBe('olympicLift')
    expect(steps[1].exerciseName).toBe(12)
    expect(steps[1].durationReps).toBe(12)
    expect(steps[2].exerciseCategory).toBe('squat')
    expect(steps[2].exerciseName).toBe(79)
    expect(steps[3].exerciseCategory).toBe('flye')
    expect(steps[3].exerciseName).toBe(4)
    expect(steps[4].exerciseCategory).toBe('carry')
    expect(steps[4].exerciseName).toBe(4)
    expect(steps[4].durationTime).toBe(50)
  })

  it('round-trips every preset without errors', () => {
    for (const preset of PRESETS) {
      const messages = decode(encodeSessionToFit(preset))
      expect(messages.workoutMesgs[0].numValidSteps).toBe(messages.workoutStepMesgs.length)
    }
  })
})
