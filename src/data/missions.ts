import type { LaunchSite, TargetOrbit } from '../types/models'
import { getCircularOrbitVelocityMS } from '../orbital/orbit'

export const launchSites: LaunchSite[] = [
  {
    id: 'ksc',
    name: 'Kennedy Space Center',
    latitudeDeg: 28.5729,
    longitudeDeg: -80.649,
  },
  {
    id: 'vsfb',
    name: 'Vandenberg Space Force Base',
    latitudeDeg: 34.742,
    longitudeDeg: -120.5724,
  },
  {
    id: 'ccsfs',
    name: 'Cape Canaveral',
    latitudeDeg: 28.3922,
    longitudeDeg: -80.6077,
  },
]

export const targetOrbits: TargetOrbit[] = [
  {
    id: 'SUBORBITAL',
    name: 'Suborbital Flight',
    targetAltitudeM: 100_000,
    requiredVelocityMS: 1_200,
  },
  {
    id: 'LEO',
    name: 'Low Earth Orbit (Simplified 200 km)',
    targetAltitudeM: 200_000,
    requiredVelocityMS: getCircularOrbitVelocityMS(200_000),
  },
]
