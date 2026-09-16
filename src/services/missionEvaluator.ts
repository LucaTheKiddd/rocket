import type { MissionResult, TargetOrbit } from '../types/models'

export const evaluateMissionOutcome = (
  target: TargetOrbit,
  maxAltitudeM: number,
  finalVelocityMS: number,
  availableDeltaVMS: number,
): MissionResult => {
  const metAltitude = maxAltitudeM >= target.targetAltitudeM
  const metVelocity = finalVelocityMS >= target.requiredVelocityMS

  if (metAltitude && metVelocity) {
    return {
      success: true,
      summary: 'MISSION SUCCESS',
      reason: `Vehicle achieved the simplified ${target.name} target conditions.`,
    }
  }

  if (!metAltitude) {
    return {
      success: false,
      summary: 'MISSION FAILURE',
      reason: `Vehicle peaked at ${(maxAltitudeM / 1000).toFixed(1)} km, below the ${(target.targetAltitudeM / 1000).toFixed(0)} km target altitude.`,
    }
  }

  if (!metVelocity) {
    return {
      success: false,
      summary: 'MISSION FAILURE',
      reason: `Vehicle reached target altitude but velocity was ${finalVelocityMS.toFixed(0)} m/s, below the ${target.requiredVelocityMS.toFixed(0)} m/s target. Estimated delta-v remaining: ${availableDeltaVMS.toFixed(0)} m/s.`,
    }
  }

  return {
    success: false,
    summary: 'MISSION FAILURE',
    reason: 'Simulation ended before meeting target conditions.',
  }
}
