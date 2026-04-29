import { useEffect, useState } from 'react'
import {
  approvePlace,
  fetchPendingPlaces,
  rejectPlace,
} from '../api/adminPlaces'
import { PLACE_CATEGORY_LABELS } from '../constants/placeCategory'
import type { PlaceResponse } from '../types/place'

export function AdminPendingPlacesPage() {
  const [places, setPlaces] = useState<PlaceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadPlaces = () => {
    setLoading(true)
    setError(null)
    fetchPendingPlaces()
      .then(setPlaces)
      .catch((error) => {
        if (error.response?.status === 403) {
          setError('관리자 권한이 필요합니다.')
          return
        }
        setError('승인 대기 장소를 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPlaces()
  }, [])

  const handleApprove = async (placeId: number) => {
    try {
      await approvePlace(placeId)
      setPlaces((current) => current.filter((place) => place.id !== placeId))
      setNotice('장소를 승인했습니다.')
    } catch {
      setError('장소 승인에 실패했습니다.')
    }
  }

  const handleReject = async (placeId: number) => {
    try {
      await rejectPlace(placeId)
      setPlaces((current) => current.filter((place) => place.id !== placeId))
      setNotice('장소를 반려했습니다.')
    } catch {
      setError('장소 반려에 실패했습니다.')
    }
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">관리자</p>
          <h2>승인 대기 장소</h2>
        </div>
      </div>

      {notice && <div className="inline-notice">{notice}</div>}
      {error && <div className="inline-error">{error}</div>}
      {loading && <div className="page-status">승인 대기 장소를 불러오는 중입니다.</div>}

      {!loading && places.length === 0 && (
        <div className="empty-state">승인 대기 장소가 없습니다.</div>
      )}

      <div className="place-list">
        {places.map((place) => (
          <article key={place.id} className="list-card">
            <div>
              <span className="status-badge status-badge--pending">승인 대기</span>
              <h3>{place.name}</h3>
              <p>{PLACE_CATEGORY_LABELS[place.category]}</p>
              <p>{place.address}</p>
              {place.priceInfo && <p>{place.priceInfo}</p>}
            </div>
            <div className="card-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => handleApprove(place.id)}
              >
                승인
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => handleReject(place.id)}
              >
                반려
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
