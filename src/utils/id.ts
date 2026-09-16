let sequence = 0

export const createId = (prefix: string): string => {
  sequence += 1
  return `${prefix}-${sequence}`
}
