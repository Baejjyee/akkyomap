import { apiClient } from './client'
import type {
  MapBounds,
  PlaceCreateRequest,
  PlaceDetailResponse,
  PlaceMapResponse,
} from '../types/place'

export async function fetchPlacesInBounds(
  bounds: MapBounds,
): Promise<PlaceMapResponse[]> {
  const response = await apiClient.get<PlaceMapResponse[]>('/places/map', {
    params: bounds,
  })
  return response.data
}

export async function createPlace(
  request: PlaceCreateRequest,
): Promise<PlaceDetailResponse> {
  const response = await apiClient.post<PlaceDetailResponse>('/places', request)
  return response.data
}

export async function fetchPlaceDetail(
  placeId: number,
): Promise<PlaceDetailResponse> {
  const response = await apiClient.get<PlaceDetailResponse>(`/places/${placeId}`)
  return response.data
}
