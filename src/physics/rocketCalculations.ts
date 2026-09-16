import type { ComponentRegistry, Engine, Rocket, Stage, StageRuntimeState } from '../types/models'
import { STANDARD_GRAVITY } from '../utils/constants'

const EPSILON = 1e-6

const getStageComponents = (stage: Stage, registry: ComponentRegistry) =>
  stage.components.map((entry) => {
    const component = registry.byId[entry.componentId]
    if (!component) {
      throw new Error(`Unknown component: ${entry.componentId}`)
    }
    return component
  })

const getStageEngines = (stage: Stage, registry: ComponentRegistry): Engine[] =>
  getStageComponents(stage, registry).filter((component): component is Engine => component.type === 'ENGINE')

export const getStageDryMassKg = (stage: Stage, registry: ComponentRegistry): number =>
  getStageComponents(stage, registry).reduce((sum, component) => sum + component.dryMassKg, 0)

export const getStagePropellantMassKg = (stage: Stage, registry: ComponentRegistry): number =>
  getStageComponents(stage, registry)
    .filter((component) => component.type === 'FUEL_TANK')
    .reduce((sum, component) => sum + component.propellantCapacityKg, 0)

export const getStageTotalMassKg = (stage: Stage, registry: ComponentRegistry): number =>
  getStageDryMassKg(stage, registry) + getStagePropellantMassKg(stage, registry)

export const getRocketDryMassKg = (rocket: Rocket, registry: ComponentRegistry): number =>
  rocket.stages.reduce((sum, stage) => sum + getStageDryMassKg(stage, registry), 0)

export const getRocketPropellantMassKg = (rocket: Rocket, registry: ComponentRegistry): number =>
  rocket.stages.reduce((sum, stage) => sum + getStagePropellantMassKg(stage, registry), 0)

export const getRocketTotalMassKg = (rocket: Rocket, registry: ComponentRegistry): number =>
  getRocketDryMassKg(rocket, registry) + getRocketPropellantMassKg(rocket, registry)

export const getStageThrustN = (stage: Stage, registry: ComponentRegistry, inVacuum: boolean): number =>
  getStageEngines(stage, registry).reduce(
    (sum, engine) => sum + (inVacuum ? engine.vacuumThrustN : engine.seaLevelThrustN),
    0,
  )

export const getStageMassFlowKgS = (stage: Stage, registry: ComponentRegistry): number =>
  getStageEngines(stage, registry).reduce((sum, engine) => sum + engine.propellantMassFlowKgS, 0)

export const getMassRatio = (initialMassKg: number, finalMassKg: number): number => {
  if (initialMassKg <= 0 || finalMassKg <= 0) {
    throw new Error('Mass values must be positive')
  }
  if (initialMassKg <= finalMassKg) {
    throw new Error('Initial mass must be greater than final mass')
  }
  return initialMassKg / finalMassKg
}

export const getWeightedIspS = (stage: Stage, registry: ComponentRegistry, inVacuum: boolean): number => {
  const engines = getStageEngines(stage, registry)
  if (!engines.length) {
    return 0
  }

  const thrustValues = engines.map((engine) => (inVacuum ? engine.vacuumThrustN : engine.seaLevelThrustN))
  const totalThrust = thrustValues.reduce((sum, value) => sum + value, 0)
  if (totalThrust <= EPSILON) {
    return 0
  }

  return engines.reduce((weighted, engine, index) => {
    const thrust = thrustValues[index]
    const isp = inVacuum ? engine.specificImpulseVacS : engine.specificImpulseSeaLevelS
    return weighted + (isp * thrust) / totalThrust
  }, 0)
}

/**
 * Tsiolkovsky equation: Δv = Isp × g0 × ln(m0 / mf)
 * Assumptions: impulse is applied in-line, effective Isp is stage-constant,
 * and aerodynamic/gravity losses are not subtracted in this ideal metric.
 */
export const getStageDeltaVMS = (
  stage: Stage,
  payloadMassKg: number,
  registry: ComponentRegistry,
  inVacuum: boolean,
): number => {
  const dryMass = getStageDryMassKg(stage, registry)
  const propellantMass = getStagePropellantMassKg(stage, registry)
  const isp = getWeightedIspS(stage, registry, inVacuum)

  if (isp <= 0 || propellantMass <= EPSILON) {
    return 0
  }

  const m0 = dryMass + propellantMass + payloadMassKg
  const mf = dryMass + payloadMassKg

  return isp * STANDARD_GRAVITY * Math.log(getMassRatio(m0, mf))
}

export const getRocketDeltaVMS = (rocket: Rocket, registry: ComponentRegistry, inVacuum = true): number => {
  let payloadMassKg = 0
  let deltaV = 0

  for (let index = rocket.stages.length - 1; index >= 0; index -= 1) {
    const stage = rocket.stages[index]
    const stageDeltaV = getStageDeltaVMS(stage, payloadMassKg, registry, inVacuum)
    deltaV += stageDeltaV
    payloadMassKg += getStageTotalMassKg(stage, registry)
  }

  return deltaV
}

export const getThrustToWeightRatio = (thrustN: number, massKg: number, gravityMS2 = STANDARD_GRAVITY): number => {
  if (massKg <= 0) {
    throw new Error('Mass must be positive')
  }
  return thrustN / (massKg * gravityMS2)
}

export const getStageBurnTimeSec = (stage: Stage, registry: ComponentRegistry): number => {
  const propellantKg = getStagePropellantMassKg(stage, registry)
  const massFlowKgS = getStageMassFlowKgS(stage, registry)
  if (massFlowKgS <= EPSILON) {
    return 0
  }
  return propellantKg / massFlowKgS
}

export const getRemainingDeltaVMS = (
  state: { massKg: number; fuelRemainingKg: number; activeStage: Stage | null },
  registry: ComponentRegistry,
): number => {
  if (!state.activeStage || state.fuelRemainingKg <= EPSILON) {
    return 0
  }

  const isp = getWeightedIspS(state.activeStage, registry, true)
  if (isp <= 0) {
    return 0
  }

  const finalMass = state.massKg - state.fuelRemainingKg
  if (finalMass <= EPSILON || state.massKg <= finalMass) {
    return 0
  }

  return isp * STANDARD_GRAVITY * Math.log(state.massKg / finalMass)
}

export const createStageRuntimeStates = (rocket: Rocket, registry: ComponentRegistry): StageRuntimeState[] =>
  rocket.stages.map((stage) => ({
    stageId: stage.id,
    dryMassKg: getStageDryMassKg(stage, registry),
    propellantInitialKg: getStagePropellantMassKg(stage, registry),
    propellantRemainingKg: getStagePropellantMassKg(stage, registry),
    detached: false,
  }))

export const validateRocket = (rocket: Rocket, registry: ComponentRegistry): string[] => {
  const errors: string[] = []
  if (!rocket.stages.length) {
    errors.push('Rocket must include at least one stage.')
    return errors
  }

  rocket.stages.forEach((stage, index) => {
    const components = getStageComponents(stage, registry)
    if (!components.length) {
      errors.push(`Stage ${index + 1} has no components.`)
    }
    const hasEngine = components.some((component) => component.type === 'ENGINE')
    if (!hasEngine) {
      errors.push(`Stage ${index + 1} has no engine.`)
    }
    const propellantMass = components
      .filter((component) => component.type === 'FUEL_TANK')
      .reduce((sum, component) => sum + component.propellantCapacityKg, 0)
    if (propellantMass <= EPSILON) {
      errors.push(`Stage ${index + 1} has no propellant tank.`)
    }
  })

  return errors
}
