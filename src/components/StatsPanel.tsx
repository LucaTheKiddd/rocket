import {
  getRocketDeltaVMS,
  getRocketDryMassKg,
  getRocketPropellantMassKg,
  getRocketTotalMassKg,
  getStageBurnTimeSec,
  getStageThrustN,
  getThrustToWeightRatio,
} from '../physics/rocketCalculations'
import { STANDARD_GRAVITY } from '../utils/constants'
import type { ComponentRegistry, Rocket } from '../types/models'

interface StatsPanelProps {
  rocket: Rocket
  registry: ComponentRegistry
}

export const StatsPanel = ({ rocket, registry }: StatsPanelProps) => {
  const totalMass = getRocketTotalMassKg(rocket, registry)
  const dryMass = getRocketDryMassKg(rocket, registry)
  const propellantMass = getRocketPropellantMassKg(rocket, registry)
  const firstStage = rocket.stages[0]
  const thrust = firstStage ? getStageThrustN(firstStage, registry, false) : 0
  const twr = totalMass > 0 ? getThrustToWeightRatio(thrust, totalMass, STANDARD_GRAVITY) : 0
  const stageBurnTime = firstStage ? getStageBurnTimeSec(firstStage, registry) : 0
  const deltaV = getRocketDeltaVMS(rocket, registry)
  const massRatio = dryMass > 0 ? totalMass / dryMass : 0

  return (
    <section className="panel">
      <h2>Engineering Snapshot</h2>
      <div className="metrics-grid">
        <Metric label="Total Mass" value={`${totalMass.toFixed(0)} kg`} />
        <Metric label="Dry Mass" value={`${dryMass.toFixed(0)} kg`} />
        <Metric label="Propellant" value={`${propellantMass.toFixed(0)} kg`} />
        <Metric label="Total Thrust" value={`${thrust.toFixed(0)} N`} />
        <Metric label="Thrust/Weight" value={twr.toFixed(2)} />
        <Metric label="Mass Ratio" value={massRatio.toFixed(2)} />
        <Metric label="Delta-v (ideal)" value={`${deltaV.toFixed(0)} m/s`} />
        <Metric label="Stage Burn Time" value={`${stageBurnTime.toFixed(1)} s`} />
      </div>
      <p className="caption">
        Simplified assumptions: ideal impulsive burn and no gravity/drag losses in the displayed delta-v.
      </p>
    </section>
  )
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <article className="metric">
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
)
