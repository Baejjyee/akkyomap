import { PLACE_CATEGORY_LABELS } from '../constants/placeCategory'
import type { PlaceDetailResponse, PlaceMapResponse } from '../types/place'

interface PlaceInfoCardProps {
  place: PlaceMapResponse | null
  detail: PlaceDetailResponse | null
  loading?: boolean
  onClose: () => void
}

export function PlaceInfoCard({
  place,
  detail,
  loading = false,
  onClose,
}: PlaceInfoCardProps) {
  if (!place) {
    return null
  }

  const address = detail?.address ?? '주소 정보 없음'

  return (
    <aside className="place-card" aria-label="선택한 장소 정보">
      <button
        type="button"
        className="icon-button place-card__close"
        onClick={onClose}
        aria-label="장소 정보 닫기"
      >
        ×
      </button>
      <p className="eyebrow">{PLACE_CATEGORY_LABELS[place.category]}</p>
      <h2>{place.name}</h2>
      <dl>
        <div>
          <dt>가격 정보</dt>
          <dd>{place.priceInfo || '가격 정보 없음'}</dd>
        </div>
        <div>
          <dt>주소</dt>
          <dd>{loading ? '주소를 불러오는 중입니다.' : address}</dd>
        </div>
      </dl>
    </aside>
  )
}
