import { describe, expect, it } from 'vitest'
import { componentRegistry } from '../data/componentRegistry'
import {
  getRocketDryMassKg,
  getRocketDeltaVMS,
  getRocketPropellantMassKg,
  getRocketTotalMassKg,
  getStagePropellantMassKg,
  getStageThrustN,
  getThrustToWeightRatio,
  validateRocket,
} from '../physics/rocketCalculations'
import type { Rocket } from '../types/models'

const testRocket: Rocket = {
  id: 'rocket-test',
  name: 'Test Vehicle',
  stages: [
    {
      id: 'stage-1',
      name: 'Stage 1',
      components: [
        { instanceId: 'a', componentId: 'engine-small-liquid' },
        { instanceId: 'b', componentId: 'tank-small' },
        { instanceId: 'c', componentId: 'structure-section' },
      ],
    },
    {
      id: 'stage-2',
      name: 'Stage 2',
      components: [
        { instanceId: 'd', componentId: 'engine-small-liquid' },
        { instanceId: 'e', componentId: 'tank-small' },
        { instanceId: 'f', componentId: 'payload-basic' },
      ],
    },
  ],
}

describe('rocket calculations', () => {
  it('aggregates component mass correctly', () => {
    expect(getRocketDryMassKg(testRocket, componentRegistry)).toBe(1220)
    expect(getRocketPropellantMassKg(testRocket, componentRegistry)).toBe(3600)
    expect(getRocketTotalMassKg(testRocket, componentRegistry)).toBe(4820)
  })

  it('calculates stage mass and thrust', () => {
    expect(getStagePropellantMassKg(testRocket.stages[0], componentRegistry)).toBe(1800)
    expect(getStageThrustN(testRocket.stages[0], componentRegistry, false)).toBe(210000)
  })

  it('computes non-zero delta-v', () => {
    expect(getRocketDeltaVMS(testRocket, componentRegistry)).toBeGreaterThan(1000)
  })

  it('computes thrust-to-weight ratio', () => {
    const twr = getThrustToWeightRatio(210000, 4850)
    expect(twr).toBeCloseTo(4.42, 2)
  })

  it('reports invalid rocket definitions', () => {
    const invalid: Rocket = {
      id: 'invalid',
      name: 'Invalid',
      stages: [{ id: 's1', name: 'S1', components: [] }],
    }

    expect(validateRocket(invalid, componentRegistry).length).toBeGreaterThan(0)
  })
})
