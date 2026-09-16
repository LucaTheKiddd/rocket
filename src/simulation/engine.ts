import { getDragForceN, getDynamicPressurePa, getAirDensityKgM3 } from '../physics/atmosphere'
import { getGravityMS2 } from '../physics/gravity'
import {
  createStageRuntimeStates,
  getRemainingDeltaVMS,
  getRocketTotalMassKg,
  getStageMassFlowKgS,
  getStageThrustN,
  validateRocket,
} from '../physics/rocketCalculations'
import { evaluateMissionOutcome } from '../services/missionEvaluator'
import type { ComponentRegistry, Mission, Rocket, SimulationState, TargetOrbit, Telemetry } from '../types/models'

export const createInitialSimulationState = (
  rocket: Rocket,
  mission: Mission,
  registry: ComponentRegistry,
  dtSec = 0.5,
): SimulationState => {
  const errors = validateRocket(rocket, registry)
  const initialMass = getRocketTotalMassKg(rocket, registry)
  const stageStates = createStageRuntimeStates(rocket, registry)
  const firstTelemetry: Telemetry = {
    timeSec: 0,
    altitudeM: 0,
    velocityMS: 0,
    accelerationMS2: 0,
    massKg: initialMass,
    fuelRemainingKg: stageStates.reduce((sum, stage) => sum + stage.propellantRemainingKg, 0),
    thrustN: 0,
    dynamicPressurePa: 0,
  }

  return {
    status: errors.length ? 'COMPLETE' : 'IDLE',
    timeSec: 0,
    dtSec,
    rocket,
    activeStageIndex: 0,
    stageStates,
    altitudeM: 0,
    velocityMS: 0,
    accelerationMS2: 0,
    massKg: initialMass,
    thrustN: 0,
    fuelRemainingKg: firstTelemetry.fuelRemainingKg,
    dynamicPressurePa: 0,
    maxAltitudeM: 0,
    telemetryHistory: [firstTelemetry],
    missionResult: errors.length
      ? {
          success: false,
          summary: 'MISSION FAILURE',
          reason: errors.join(' '),
        }
      : {
          success: false,
          summary: 'SIMPLIFIED MODEL',
          reason: `Using simplified ascent model for ${mission.targetOrbitId} planning.`,
        },
  }
}

const finishMission = (
  state: SimulationState,
  target: TargetOrbit,
  registry: ComponentRegistry,
): SimulationState => {
  const availableDeltaV = getRemainingDeltaVMS(
    {
      massKg: state.massKg,
      fuelRemainingKg: state.fuelRemainingKg,
      activeStage: state.rocket.stages[state.activeStageIndex] ?? null,
    },
    registry,
  )

  return {
    ...state,
    status: 'COMPLETE',
    missionResult: evaluateMissionOutcome(target, state.maxAltitudeM, state.velocityMS, availableDeltaV),
  }
}

export const stepSimulation = (
  state: SimulationState,
  registry: ComponentRegistry,
  target: TargetOrbit,
  dtOverride?: number,
): SimulationState => {
  if (state.status === 'COMPLETE') {
    return state
  }

  const dt = dtOverride ?? state.dtSec
  const stage = state.rocket.stages[state.activeStageIndex]
  const stageState = state.stageStates[state.activeStageIndex]

  if (!stage || !stageState) {
    return finishMission(state, target, registry)
  }

  const gravity = getGravityMS2(state.altitudeM)
  const airDensity = getAirDensityKgM3(state.altitudeM)
  const dragCoefficient = 0.28
  const referenceAreaM2 = 1.8

  const stageMassFlow = getStageMassFlowKgS(stage, registry)
  const requestedBurnKg = stageMassFlow * dt
  const actualBurnKg = Math.min(stageState.propellantRemainingKg, requestedBurnKg)
  const burnRatio = requestedBurnKg > 0 ? actualBurnKg / requestedBurnKg : 0

  const thrustN = getStageThrustN(stage, registry, state.altitudeM > 20_000) * burnRatio

  stageState.propellantRemainingKg = Math.max(0, stageState.propellantRemainingKg - actualBurnKg)

  const fuelRemainingKg = state.stageStates.reduce((sum, runtime) => sum + runtime.propellantRemainingKg, 0)
  const massKg = Math.max(1, state.massKg - actualBurnKg)
  const dragN = getDragForceN(airDensity, state.velocityMS, dragCoefficient, referenceAreaM2)
  const dragDirection = state.velocityMS >= 0 ? -1 : 1
  const netForceN = thrustN + dragN * dragDirection - massKg * gravity
  const accelerationMS2 = netForceN / massKg

  const velocityMS = state.velocityMS + accelerationMS2 * dt
  const altitudeM = Math.max(0, state.altitudeM + velocityMS * dt)
  const dynamicPressurePa = getDynamicPressurePa(airDensity, velocityMS)

  let activeStageIndex = state.activeStageIndex

  if (stageState.propellantRemainingKg <= 0.001) {
    if (activeStageIndex < state.stageStates.length - 1) {
      stageState.detached = true
      activeStageIndex += 1
    }
  }

  const nextState: SimulationState = {
    ...state,
    status: 'RUNNING',
    timeSec: state.timeSec + dt,
    activeStageIndex,
    altitudeM,
    velocityMS,
    accelerationMS2,
    massKg,
    thrustN,
    fuelRemainingKg,
    dynamicPressurePa,
    maxAltitudeM: Math.max(state.maxAltitudeM, altitudeM),
    telemetryHistory: [
      ...state.telemetryHistory,
      {
        timeSec: state.timeSec + dt,
        altitudeM,
        velocityMS,
        accelerationMS2,
        massKg,
        fuelRemainingKg,
        thrustN,
        dynamicPressurePa,
      },
    ],
  }

  const noFuelRemaining = fuelRemainingKg <= 0.001
  const falling = velocityMS <= 0 && altitudeM <= target.targetAltitudeM * 0.25
  const timeout = nextState.timeSec > 900
  const successReached =
    nextState.maxAltitudeM >= target.targetAltitudeM && velocityMS >= target.requiredVelocityMS

  if (successReached || noFuelRemaining || timeout || falling) {
    return finishMission(nextState, target, registry)
  }

  return nextState
}
