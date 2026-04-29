export function normalizeCoordinate(value: number | string): number | null {
  const coordinate = Number(value)

  if (!Number.isFinite(coordinate)) {
    return null
  }

  return Number(coordinate.toFixed(6))
}
