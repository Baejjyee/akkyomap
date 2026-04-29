import { useEffect, useState } from 'react'
import { fetchPlacesInBounds } from '../api/places'
import type { MapBounds, PlaceMapResponse } from '../types/place'

interface UsePlacesInBoundsResult {
  places: PlaceMapResponse[]
  loading: boolean
  error: string | null
}

export function usePlacesInBounds(
  bounds: MapBounds | null,
): UsePlacesInBoundsResult {
  const [places, setPlaces] = useState<PlaceMapResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bounds) {
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    fetchPlacesInBounds(bounds)
      .then((nextPlaces) => {
        if (active) {
          setPlaces(nextPlaces)
          setError(null)
        }
      })
      .catch(() => {
        if (active) {
          setPlaces([])
          setError('장소 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [bounds])

  return { places, loading, error }
}
