import { getRemainingDeltaVMS } from '../physics/rocketCalculations'
import type { ComponentRegistry, SimulationState } from '../types/models'

interface TelemetryPanelProps {
  state: SimulationState
  registry: ComponentRegistry
}

export const TelemetryPanel = ({ state, registry }: TelemetryPanelProps) => {
  const activeStage = state.rocket.stages[state.activeStageIndex] ?? null
  const deltaVRemaining = getRemainingDeltaVMS(
    {
      massKg: state.massKg,
      fuelRemainingKg: state.fuelRemainingKg,
      activeStage,
    },
    registry,
  )

  return (
    <section className="panel">
      <h2>Telemetry</h2>
      <div className="metrics-grid">
        <Metric label="Flight Time" value={`${state.timeSec.toFixed(1)} s`} />
        <Metric label="Altitude" value={`${state.altitudeM.toFixed(0)} m`} />
        <Metric label="Velocity" value={`${state.velocityMS.toFixed(1)} m/s`} />
        <Metric label="Acceleration" value={`${state.accelerationMS2.toFixed(2)} m/s²`} />
        <Metric label="Mass" value={`${state.massKg.toFixed(1)} kg`} />
        <Metric label="Fuel" value={`${state.fuelRemainingKg.toFixed(1)} kg`} />
        <Metric label="Thrust" value={`${state.thrustN.toFixed(0)} N`} />
        <Metric label="Dynamic Pressure" value={`${state.dynamicPressurePa.toFixed(0)} Pa`} />
        <Metric label="Delta-v Remaining" value={`${deltaVRemaining.toFixed(0)} m/s`} />
      </div>

      {state.status === 'COMPLETE' && state.missionResult && (
        <div className={`mission-result ${state.missionResult.success ? 'success' : 'failure'}`}>
          <strong>{state.missionResult.summary}</strong>
          <p>{state.missionResult.reason}</p>
        </div>
      )}
    </section>
  )
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <article className="metric">
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
)
