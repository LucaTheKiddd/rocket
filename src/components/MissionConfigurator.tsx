import type { LaunchSite, Mission, TargetOrbit } from '../types/models'

interface MissionConfiguratorProps {
  mission: Mission
  launchSites: LaunchSite[]
  targetOrbits: TargetOrbit[]
  onMissionChange: (mission: Mission) => void
}

export const MissionConfigurator = ({
  mission,
  launchSites,
  targetOrbits,
  onMissionChange,
}: MissionConfiguratorProps) => {
  return (
    <section className="panel">
      <h2>Mission Configuration</h2>
      <div className="field-grid">
        <label>
          Launch Site
          <select
            value={mission.launchSiteId}
            onChange={(event) => onMissionChange({ ...mission, launchSiteId: event.target.value })}
          >
            {launchSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Target
          <select
            value={mission.targetOrbitId}
            onChange={(event) => onMissionChange({ ...mission, targetOrbitId: event.target.value as Mission['targetOrbitId'] })}
          >
            {targetOrbits.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="caption">Simulation model is intentionally simplified for MVP validation.</p>
    </section>
  )
}
