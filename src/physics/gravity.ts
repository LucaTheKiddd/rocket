import { EARTH_RADIUS_M, STANDARD_GRAVITY } from '../utils/constants'

export const getGravityMS2 = (altitudeM: number): number => {
  const radius = EARTH_RADIUS_M + Math.max(altitudeM, 0)
  return STANDARD_GRAVITY * (EARTH_RADIUS_M / radius) ** 2
}
