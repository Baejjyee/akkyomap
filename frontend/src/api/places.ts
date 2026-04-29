import { apiClient } from './client'
import type {
  MapBounds,
  MyPlaceResponse,
  PlaceCreateRequest,
  PlaceDetailResponse,
  PlaceMapResponse,
  PlaceStatusResponse,
  PlaceUpdateRequest,
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

export async function fetchMyPlaces(): Promise<MyPlaceResponse[]> {
  const response = await apiClient.get<MyPlaceResponse[]>('/places/me')
  return response.data
}

export async function updateMyPlace(
  placeId: number,
  request: PlaceUpdateRequest,
): Promise<PlaceDetailResponse> {
  const response = await apiClient.patch<PlaceDetailResponse>(
    `/places/${placeId}`,
    request,
  )
  return response.data
}

export async function deleteMyPlace(
  placeId: number,
): Promise<PlaceStatusResponse> {
  const response = await apiClient.delete<PlaceStatusResponse>(
    `/places/${placeId}`,
  )
  return response.data
}
