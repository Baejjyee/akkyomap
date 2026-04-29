export type PlaceCategory =
  | 'RESTAURANT'
  | 'CAFE'
  | 'STUDY_SPACE'
  | 'PRINT_COPY'
  | 'CONVENIENCE'

export type PlaceStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'HIDDEN'
  | 'DELETED'

export interface PlaceCreateRequest {
  name: string
  category: PlaceCategory
  address: string
  latitude: number
  longitude: number
  priceInfo?: string
  description?: string
}

export type PlaceUpdateRequest = PlaceCreateRequest

export interface PlaceMapResponse {
  id: number
  name: string
  category: PlaceCategory
  latitude: number
  longitude: number
  priceInfo: string | null
}

export interface PlaceResponse {
  id: number
  name: string
  category: PlaceCategory
  address: string
  priceInfo: string | null
  status: PlaceStatus
}

export interface PlaceDetailResponse {
  id: number
  name: string
  category: PlaceCategory
  address: string
  latitude: number
  longitude: number
  priceInfo: string | null
  description: string | null
  status: PlaceStatus
  createdAt: string
  updatedAt: string
}

export interface MyPlaceResponse {
  id: number
  name: string
  category: PlaceCategory
  address: string
  priceInfo: string | null
  status: PlaceStatus
  createdAt: string
  updatedAt: string
}

export interface PlaceStatusResponse {
  id: number
  status: PlaceStatus
}

export interface MapBounds {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}
