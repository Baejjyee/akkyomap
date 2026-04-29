import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { deleteMyPlace, fetchMyPlaces } from '../api/places'
import { PLACE_CATEGORY_LABELS } from '../constants/placeCategory'
import type { MyPlaceResponse, PlaceStatus } from '../types/place'

const PLACE_STATUS_LABELS: Record<PlaceStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '지도 노출 중',
  REJECTED: '반려',
  HIDDEN: '숨김',
  DELETED: '삭제됨',
}

export function MyPlacesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [places, setPlaces] = useState<MyPlaceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadPlaces = () => {
    setLoading(true)
    setError(null)
    fetchMyPlaces()
      .then(setPlaces)
      .catch(() => setError('내 장소 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPlaces()
  }, [])

  useEffect(() => {
    const state = location.state as { notice?: string } | null
    if (state?.notice) {
      setNotice(state.notice)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const handleDelete = async (placeId: number) => {
    if (!confirm('이 장소를 삭제하시겠습니까? 삭제 후 목록에서 제외됩니다.')) {
      return
    }

    try {
      await deleteMyPlace(placeId)
      setPlaces((current) => current.filter((place) => place.id !== placeId))
      setNotice('장소가 삭제되었습니다.')
    } catch {
      setError('장소 삭제에 실패했습니다.')
    }
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">내 장소</p>
          <h2>내가 등록한 장소</h2>
        </div>
        <Link to="/" className="secondary-button">
          지도로 이동
        </Link>
      </div>

      {notice && <div className="inline-notice">{notice}</div>}
      {error && <div className="inline-error">{error}</div>}
      {loading && <div className="page-status">내 장소를 불러오는 중입니다.</div>}

      {!loading && places.length === 0 && (
        <div className="empty-state">등록한 장소가 없습니다.</div>
      )}

      <div className="place-list">
        {places.map((place) => (
          <article key={place.id} className="list-card">
            <div>
              <span className={`status-badge status-badge--${place.status.toLowerCase()}`}>
                {PLACE_STATUS_LABELS[place.status]}
              </span>
              <h3>{place.name}</h3>
              <p>{PLACE_CATEGORY_LABELS[place.category]}</p>
              <p>{place.address}</p>
              {place.priceInfo && <p>{place.priceInfo}</p>}
            </div>
            <div className="card-actions">
              <Link
                to={`/my/places/${place.id}/edit`}
                state={{ place }}
                className="secondary-button"
              >
                수정
              </Link>
              <button
                type="button"
                className="danger-button"
                onClick={() => handleDelete(place.id)}
              >
                삭제
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
