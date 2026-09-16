import type { SimulationState, TargetOrbit } from '../types/models'

interface TrajectoryViewProps {
  state: SimulationState
  target: TargetOrbit
}

export const TrajectoryView = ({ state, target }: TrajectoryViewProps) => {
  const maxAltitude = Math.max(target.targetAltitudeM * 1.2, state.maxAltitudeM, 10_000)
  const width = 520
  const height = 260

  const points = state.telemetryHistory
    .map((sample, index, list) => {
      const x = list.length > 1 ? (index / (list.length - 1)) * (width - 60) + 30 : 30
      const y = height - 20 - (sample.altitudeM / maxAltitude) * (height - 60)
      return `${x.toFixed(1)},${Math.max(20, y).toFixed(1)}`
    })
    .join(' ')

  const currentPoint = points.split(' ').at(-1) ?? '30,240'
  const [rocketX, rocketY] = currentPoint.split(',').map(Number)
  const targetY = height - 20 - (target.targetAltitudeM / maxAltitude) * (height - 60)

  return (
    <section className="panel">
      <h2>Trajectory (2D Simplified)</h2>
      <svg className="trajectory" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Flight trajectory">
        <rect x="0" y="0" width={width} height={height} fill="var(--surface)" />
        <circle cx="-80" cy={height + 80} r="180" fill="var(--earth)" opacity="0.75" />
        <circle cx="30" cy={height - 20} r="4" fill="var(--accent)" />
        <line x1="20" y1={targetY} x2={width - 20} y2={targetY} stroke="var(--warning)" strokeDasharray="6 4" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={points} />
        <circle cx={rocketX} cy={rocketY} r="5" fill="var(--success)" />
        <text x="38" y={height - 24} fill="var(--text-muted)">
          Launch
        </text>
      </svg>
    </section>
  )
}
