import { SCALE_HEIGHT_M, SEA_LEVEL_AIR_DENSITY } from '../utils/constants'

export const getAirDensityKgM3 = (altitudeM: number): number => {
  if (altitudeM <= 0) {
    return SEA_LEVEL_AIR_DENSITY
  }
  return SEA_LEVEL_AIR_DENSITY * Math.exp(-altitudeM / SCALE_HEIGHT_M)
}

export const getDynamicPressurePa = (densityKgM3: number, velocityMS: number): number => {
  return 0.5 * densityKgM3 * velocityMS * velocityMS
}

export const getDragForceN = (
  densityKgM3: number,
  velocityMS: number,
  dragCoefficient: number,
  areaM2: number,
): number => {
  return getDynamicPressurePa(densityKgM3, Math.abs(velocityMS)) * dragCoefficient * areaM2
}
