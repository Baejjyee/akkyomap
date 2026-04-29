import type { PlaceCategory } from '../types/place'

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  RESTAURANT: '식당',
  CAFE: '카페',
  STUDY_SPACE: '공부공간',
  PRINT_COPY: '프린트/복사',
  CONVENIENCE: '편의시설',
}

export const PLACE_CATEGORY_OPTIONS: Array<{
  value: PlaceCategory
  label: string
}> = [
  { value: 'RESTAURANT', label: PLACE_CATEGORY_LABELS.RESTAURANT },
  { value: 'CAFE', label: PLACE_CATEGORY_LABELS.CAFE },
  { value: 'STUDY_SPACE', label: PLACE_CATEGORY_LABELS.STUDY_SPACE },
  { value: 'PRINT_COPY', label: PLACE_CATEGORY_LABELS.PRINT_COPY },
  { value: 'CONVENIENCE', label: PLACE_CATEGORY_LABELS.CONVENIENCE },
]
