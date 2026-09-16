export type RocketComponentType =
  | 'ENGINE'
  | 'FUEL_TANK'
  | 'STRUCTURE'
  | 'PAYLOAD'
  | 'NOSE_CONE'
  | 'DECOUPLER'

export interface RocketComponentBase {
  id: string
  name: string
  type: RocketComponentType
  dryMassKg: number
  dragCoefficient: number
  referenceAreaM2: number
}

export interface Engine extends RocketComponentBase {
  type: 'ENGINE'
  vacuumThrustN: number
  seaLevelThrustN: number
  specificImpulseVacS: number
  specificImpulseSeaLevelS: number
  propellantMassFlowKgS: number
}

export interface FuelTank extends RocketComponentBase {
  type: 'FUEL_TANK'
  propellantCapacityKg: number
}

export interface Payload extends RocketComponentBase {
  type: 'PAYLOAD'
}

export interface StructuralSection extends RocketComponentBase {
  type: 'STRUCTURE' | 'NOSE_CONE' | 'DECOUPLER'
}

export type RocketComponent = Engine | FuelTank | Payload | StructuralSection

export interface StageComponent {
  instanceId: string
  componentId: string
}

export interface Stage {
  id: string
  name: string
  components: StageComponent[]
}

export interface Rocket {
  id: string
  name: string
  stages: Stage[]
}

export interface LaunchSite {
  id: string
  name: string
  latitudeDeg: number
  longitudeDeg: number
}

export type OrbitType = 'SUBORBITAL' | 'LEO'

export interface TargetOrbit {
  id: OrbitType
  name: string
  targetAltitudeM: number
  requiredVelocityMS: number
}

export interface Mission {
  launchSiteId: string
  targetOrbitId: OrbitType
  notes: string
}

export interface OrbitalState {
  apoapsisM: number
  periapsisM: number
  eccentricity: number
  inclinationDeg: number
}

export interface Telemetry {
  timeSec: number
  altitudeM: number
  velocityMS: number
  accelerationMS2: number
  massKg: number
  fuelRemainingKg: number
  thrustN: number
  dynamicPressurePa: number
}

export interface MissionResult {
  success: boolean
  summary: string
  reason: string
}

export interface StageRuntimeState {
  stageId: string
  dryMassKg: number
  propellantRemainingKg: number
  propellantInitialKg: number
  detached: boolean
}

export type SimulationStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETE'

export interface SimulationState {
  status: SimulationStatus
  timeSec: number
  dtSec: number
  rocket: Rocket
  activeStageIndex: number
  stageStates: StageRuntimeState[]
  altitudeM: number
  velocityMS: number
  accelerationMS2: number
  massKg: number
  thrustN: number
  fuelRemainingKg: number
  dynamicPressurePa: number
  maxAltitudeM: number
  telemetryHistory: Telemetry[]
  missionResult: MissionResult | null
}

export interface ComponentRegistry {
  byId: Record<string, RocketComponent>
  all: RocketComponent[]
}
