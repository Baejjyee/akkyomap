import { useState } from 'react'
import './styles.css'
import { MapView } from './components/MapView'
import { PlaceCreateForm } from './components/PlaceCreateForm'
import type { PlaceMapResponse } from './types/place'

function App() {
  const [selectedPlace, setSelectedPlace] = useState<PlaceMapResponse | null>(
    null,
  )
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const handleCreated = () => {
    setNotice('장소가 등록되었습니다. 관리자 승인 후 지도에 표시됩니다.')
  }

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">아껴맵</p>
          <h1>승인된 절약 장소 지도</h1>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setFormOpen(true)}
        >
          장소 등록
        </button>
      </header>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="text-button"
            onClick={() => setNotice(null)}
          >
            닫기
          </button>
        </div>
      )}

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
    </main>
  )
}

export default App
