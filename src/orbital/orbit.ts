import { EARTH_RADIUS_M } from '../utils/constants'

const EARTH_MU = 3.986004418e14

export const getCircularOrbitVelocityMS = (altitudeM: number): number => {
  const radius = EARTH_RADIUS_M + Math.max(0, altitudeM)
  return Math.sqrt(EARTH_MU / radius)
}
