export type PlaceCategory =
  | 'RESTAURANT'
  | 'CAFE'
  | 'STUDY_SPACE'
  | 'PRINT_COPY'
  | 'CONVENIENCE'

export type PlaceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN'

export interface PlaceCreateRequest {
  name: string
  category: PlaceCategory
  address: string
  latitude: number
  longitude: number
  priceInfo?: string
  description?: string
}

export interface PlaceMapResponse {
  id: number
  name: string
  category: PlaceCategory
  latitude: number
  longitude: number
  priceInfo: string | null
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

export interface MapBounds {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}
