import type { MapBounds } from '../types/place'

function roundCoordinate(value: number) {
  return Number(value.toFixed(6))
}

export function toMapBounds(bounds: KakaoLatLngBounds): MapBounds {
  const southWest = bounds.getSouthWest()
  const northEast = bounds.getNorthEast()
  const swLat = roundCoordinate(southWest.getLat())
  const swLng = roundCoordinate(southWest.getLng())
  const neLat = roundCoordinate(northEast.getLat())
  const neLng = roundCoordinate(northEast.getLng())

  return {
    swLat: Math.min(swLat, neLat),
    swLng: Math.min(swLng, neLng),
    neLat: Math.max(swLat, neLat),
    neLng: Math.max(swLng, neLng),
  }
}
