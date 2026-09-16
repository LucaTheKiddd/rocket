import type { ComponentRegistry, RocketComponent } from '../types/models'

const components: RocketComponent[] = [
  {
    id: 'engine-small-liquid',
    name: 'SV-10 Sparrow Engine',
    type: 'ENGINE',
    dryMassKg: 120,
    dragCoefficient: 0.2,
    referenceAreaM2: 0.45,
    vacuumThrustN: 240000,
    seaLevelThrustN: 210000,
    specificImpulseVacS: 320,
    specificImpulseSeaLevelS: 285,
    propellantMassFlowKgS: 78,
  },
  {
    id: 'engine-medium-liquid',
    name: 'MV-40 Kestrel Cluster',
    type: 'ENGINE',
    dryMassKg: 390,
    dragCoefficient: 0.24,
    referenceAreaM2: 0.95,
    vacuumThrustN: 780000,
    seaLevelThrustN: 680000,
    specificImpulseVacS: 336,
    specificImpulseSeaLevelS: 295,
    propellantMassFlowKgS: 238,
  },
  {
    id: 'tank-small',
    name: 'TS-12 Small Fuel Tank',
    type: 'FUEL_TANK',
    dryMassKg: 210,
    dragCoefficient: 0.32,
    referenceAreaM2: 1.2,
    propellantCapacityKg: 1800,
  },
  {
    id: 'tank-medium',
    name: 'TM-40 Medium Fuel Tank',
    type: 'FUEL_TANK',
    dryMassKg: 520,
    dragCoefficient: 0.34,
    referenceAreaM2: 2.1,
    propellantCapacityKg: 5200,
  },
  {
    id: 'structure-section',
    name: 'ST-2 Structural Section',
    type: 'STRUCTURE',
    dryMassKg: 140,
    dragCoefficient: 0.3,
    referenceAreaM2: 1.6,
  },
  {
    id: 'payload-basic',
    name: 'PL-2 Demo Payload',
    type: 'PAYLOAD',
    dryMassKg: 420,
    dragCoefficient: 0.28,
    referenceAreaM2: 1.0,
  },
  {
    id: 'nose-cone',
    name: 'NC-1 Nose Cone',
    type: 'NOSE_CONE',
    dryMassKg: 80,
    dragCoefficient: 0.12,
    referenceAreaM2: 0.8,
  },
  {
    id: 'decoupler-standard',
    name: 'DC-4 Decoupler',
    type: 'DECOUPLER',
    dryMassKg: 45,
    dragCoefficient: 0.22,
    referenceAreaM2: 1.1,
  },
]

export const componentRegistry: ComponentRegistry = {
  all: components,
  byId: components.reduce<Record<string, RocketComponent>>((acc, component) => {
    acc[component.id] = component
    return acc
  }, {}),
}

export const getComponentById = (componentId: string): RocketComponent => {
  const component = componentRegistry.byId[componentId]
  if (!component) {
    throw new Error(`Unknown component: ${componentId}`)
  }
  return component
}
