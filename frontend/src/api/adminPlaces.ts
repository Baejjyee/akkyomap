import { apiClient } from './client'
import type { PlaceResponse, PlaceStatusResponse } from '../types/place'

export async function fetchPendingPlaces(): Promise<PlaceResponse[]> {
  const response = await apiClient.get<PlaceResponse[]>('/admin/places/pending')
  return response.data
}

export async function approvePlace(
  placeId: number,
): Promise<PlaceStatusResponse> {
  const response = await apiClient.patch<PlaceStatusResponse>(
    `/admin/places/${placeId}/approve`,
  )
  return response.data
}

export async function rejectPlace(
  placeId: number,
): Promise<PlaceStatusResponse> {
  const response = await apiClient.patch<PlaceStatusResponse>(
    `/admin/places/${placeId}/reject`,
  )
  return response.data
}
