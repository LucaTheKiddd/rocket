import { describe, expect, it } from 'vitest'
import { componentRegistry } from '../data/componentRegistry'
import { targetOrbits } from '../data/missions'
import { getDragForceN, getAirDensityKgM3 } from '../physics/atmosphere'
import { getGravityMS2 } from '../physics/gravity'
import { createInitialSimulationState, stepSimulation } from '../simulation/engine'
import { evaluateMissionOutcome } from '../services/missionEvaluator'
import type { Mission, Rocket } from '../types/models'

const rocket: Rocket = {
  id: 'r1',
  name: 'Simulator',
  stages: [
    {
      id: 's1',
      name: 'Stage 1',
      components: [
        { instanceId: 'a1', componentId: 'engine-medium-liquid' },
        { instanceId: 'a2', componentId: 'tank-medium' },
        { instanceId: 'a3', componentId: 'decoupler-standard' },
      ],
    },
    {
      id: 's2',
      name: 'Stage 2',
      components: [
        { instanceId: 'b1', componentId: 'engine-small-liquid' },
        { instanceId: 'b2', componentId: 'tank-small' },
        { instanceId: 'b3', componentId: 'payload-basic' },
      ],
    },
  ],
}

const mission: Mission = {
  launchSiteId: 'ksc',
  targetOrbitId: 'SUBORBITAL',
  notes: 'test mission',
}

describe('simulation physics primitives', () => {
  it('computes gravity and drag deterministically', () => {
    expect(getGravityMS2(0)).toBeCloseTo(9.80665, 4)
    expect(getGravityMS2(100_000)).toBeLessThan(9.80665)
    expect(getAirDensityKgM3(0)).toBeCloseTo(1.225, 3)
    expect(getDragForceN(1.225, 100, 0.3, 2)).toBeCloseTo(3675, 0)
  })
})

describe('simulation progression', () => {
  it('consumes propellant and advances state', () => {
    const target = targetOrbits[0]
    const initial = createInitialSimulationState(rocket, mission, componentRegistry, 0.5)
    const stepped = stepSimulation(initial, componentRegistry, target)

    expect(stepped.timeSec).toBeGreaterThan(initial.timeSec)
    expect(stepped.fuelRemainingKg).toBeLessThan(initial.fuelRemainingKg)
    expect(stepped.massKg).toBeLessThan(initial.massKg)
  })

  it('handles empty tank behavior and staging', () => {
    const target = targetOrbits[0]
    let state = createInitialSimulationState(rocket, mission, componentRegistry, 1)

    for (let i = 0; i < 30; i += 1) {
      state = stepSimulation(state, componentRegistry, target)
      if (state.activeStageIndex > 0) break
    }

    expect(state.activeStageIndex).toBeGreaterThan(0)
  })

  it('terminates invalid rocket as failure', () => {
    const invalid: Rocket = {
      id: 'invalid-r',
      name: 'bad',
      stages: [{ id: 'stage', name: 'S1', components: [{ instanceId: 'x', componentId: 'tank-small' }] }],
    }

    const state = createInitialSimulationState(invalid, mission, componentRegistry)
    expect(state.status).toBe('COMPLETE')
    expect(state.missionResult?.success).toBe(false)
  })
})

describe('mission success and failure', () => {
  it('determines success when altitude and velocity targets are met', () => {
    const result = evaluateMissionOutcome(targetOrbits[0], 150_000, 1300, 100)
    expect(result.success).toBe(true)
  })

  it('determines failure reason when altitude is missed', () => {
    const result = evaluateMissionOutcome(targetOrbits[1], 90_000, 8_000, 0)
    expect(result.success).toBe(false)
    expect(result.reason).toContain('below')
  })
})
