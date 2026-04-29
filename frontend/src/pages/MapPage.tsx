import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { MapView } from '../components/MapView'
import { PlaceCreateForm } from '../components/PlaceCreateForm'
import type { PlaceMapResponse } from '../types/place'

interface LocationState {
  notice?: string
}

export function MapPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedPlace, setSelectedPlace] = useState<PlaceMapResponse | null>(
    null,
  )
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const state = location.state as LocationState | null
    if (state?.notice) {
      setNotice(state.notice)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const openCreateForm = () => {
    if (!user) {
      setNotice('장소를 등록하려면 로그인이 필요합니다.')
      return
    }
    setFormOpen(true)
  }

  const handleCreated = () => {
    setNotice('장소가 등록되었습니다. 관리자 승인 후 지도에 표시됩니다.')
  }

  return (
    <>
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <div className="notice-actions">
            {!user && (
              <Link to="/login" className="text-button">
                로그인
              </Link>
            )}
            <button
              type="button"
              className="text-button"
              onClick={() => setNotice(null)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <div className="map-toolbar">
        <button type="button" className="primary-button" onClick={openCreateForm}>
          장소 등록
        </button>
      </div>

      <MapView
        selectedPlace={selectedPlace}
        onSelectPlace={setSelectedPlace}
        onClearSelectedPlace={() => setSelectedPlace(null)}
      />

      <PlaceCreateForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={handleCreated}
      />
    </>
  )
}
