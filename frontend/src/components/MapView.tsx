import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPlaceDetail } from '../api/places'
import { useKakaoMapScript } from '../hooks/useKakaoMapScript'
import { usePlacesInBounds } from '../hooks/usePlacesInBounds'
import type {
  MapBounds,
  PlaceDetailResponse,
  PlaceMapResponse,
} from '../types/place'
import { toMapBounds } from '../utils/mapBounds'
import { PlaceInfoCard } from './PlaceInfoCard'
import { PlaceMarkerLayer } from './PlaceMarkerLayer'

interface MapViewProps {
  selectedPlace: PlaceMapResponse | null
  onSelectPlace: (place: PlaceMapResponse) => void
  onClearSelectedPlace: () => void
}

const DEFAULT_CENTER = {
  latitude: 37.5665,
  longitude: 126.978,
}

const CURRENT_LOCATION_LEVEL = 4

interface Coordinates {
  latitude: number
  longitude: number
}

export function MapView({
  selectedPlace,
  onSelectPlace,
  onClearSelectedPlace,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<KakaoMap | null>(null)
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null,
  )
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [placeDetail, setPlaceDetail] = useState<PlaceDetailResponse | null>(
    null,
  )
  const [placeDetailLoading, setPlaceDetailLoading] = useState(false)
  const scriptStatus = useKakaoMapScript()
  const { places, loading, error } = usePlacesInBounds(bounds)
  const canUseKakaoMap =
    scriptStatus === 'ready' || scriptStatus === 'missing-services'

  const refreshBounds = useCallback((nextMap: KakaoMap) => {
    setBounds(toMapBounds(nextMap.getBounds()))
  }, [])

  const moveToLocation = useCallback(
    (nextMap: KakaoMap, location: Coordinates) => {
      const kakaoMaps = window.kakao?.maps
      if (!kakaoMaps) {
        return
      }

      const position = new kakaoMaps.LatLng(location.latitude, location.longitude)
      nextMap.setCenter(position)
      nextMap.setLevel(CURRENT_LOCATION_LEVEL)
      setCurrentLocation(location)
      refreshBounds(nextMap)
    },
    [refreshBounds],
  )

  const requestCurrentLocation = useCallback(
    (targetMap: KakaoMap, showFailureMessage: boolean) => {
      if (!navigator.geolocation) {
        if (showFailureMessage) {
          setLocationMessage('이 브라우저에서는 현재 위치를 사용할 수 없습니다.')
        }
        return
      }

      setLocating(true)
      setLocationMessage(null)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          moveToLocation(targetMap, location)
          setLocating(false)
        },
        () => {
          if (showFailureMessage) {
            setLocationMessage(
              '현재 위치를 가져오지 못했습니다. 위치 권한을 확인해 주세요.',
            )
          }
          setLocating(false)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60_000,
          timeout: 8_000,
        },
      )
    },
    [moveToLocation],
  )

  useEffect(() => {
    if (!canUseKakaoMap || !mapContainerRef.current || map) {
      return
    }

    const kakaoMaps = window.kakao?.maps
    if (!kakaoMaps) {
      return
    }

    const nextMap = new kakaoMaps.Map(mapContainerRef.current, {
      center: new kakaoMaps.LatLng(
        DEFAULT_CENTER.latitude,
        DEFAULT_CENTER.longitude,
      ),
      level: 4,
    })

    const handleIdle = () => refreshBounds(nextMap)

    kakaoMaps.event.addListener(nextMap, 'idle', handleIdle)
    setMap(nextMap)
    refreshBounds(nextMap)
    requestCurrentLocation(nextMap, true)

    return () => {
      kakaoMaps.event.removeListener(nextMap, 'idle', handleIdle)
    }
  }, [canUseKakaoMap, map, refreshBounds, requestCurrentLocation])

  useEffect(() => {
    if (!map || !window.kakao?.maps || !currentLocation) {
      return
    }

    const marker = document.createElement('div')
    marker.className = 'current-location-marker'
    marker.setAttribute('aria-label', '현재 위치')

    const overlay = new window.kakao.maps.CustomOverlay({
      map,
      position: new window.kakao.maps.LatLng(
        currentLocation.latitude,
        currentLocation.longitude,
      ),
      content: marker,
      yAnchor: 0.5,
      zIndex: 4,
    })

    return () => {
      overlay.setMap(null)
    }
  }, [currentLocation, map])

  useEffect(() => {
    if (!selectedPlace) {
      setPlaceDetail(null)
      setPlaceDetailLoading(false)
      return
    }

    let active = true
    setPlaceDetail(null)
    setPlaceDetailLoading(true)

    fetchPlaceDetail(selectedPlace.id)
      .then((detail) => {
        if (active) {
          setPlaceDetail(detail)
        }
      })
      .catch(() => {
        if (active) {
          setPlaceDetail(null)
        }
      })
      .finally(() => {
        if (active) {
          setPlaceDetailLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [selectedPlace])

  return (
    <section className="map-shell" aria-label="승인된 장소 지도">
      <div ref={mapContainerRef} className="map-view" />

      {map && (
        <PlaceMarkerLayer
          map={map}
          places={places}
          onSelectPlace={onSelectPlace}
        />
      )}

      {scriptStatus === 'loading' && (
        <div className="map-overlay">지도를 불러오는 중입니다.</div>
      )}

      {scriptStatus === 'error' && (
        <div className="map-overlay map-overlay--error">
          Kakao Developers JavaScript 키를 `frontend/.env`에 설정해 주세요.
        </div>
      )}

      {scriptStatus === 'missing-services' && (
        <div className="map-sdk-warning" role="status">
          Kakao SDK가 services 라이브러리 없이 로드되어 장소 검색을 사용할 수
          없습니다. 페이지를 새로고침해 주세요.
        </div>
      )}

      {error && <div className="map-toast map-toast--error">{error}</div>}

      {loading && <div className="map-status">장소를 불러오는 중</div>}

      {locationMessage && (
        <div className="location-message" role="status">
          <span>{locationMessage}</span>
          <button
            type="button"
            className="text-button"
            onClick={() => setLocationMessage(null)}
          >
            닫기
          </button>
        </div>
      )}

      <button
        type="button"
        className="location-fab"
        onClick={() => {
          if (map) {
            requestCurrentLocation(map, true)
          }
        }}
        disabled={!map || locating}
        aria-label="내 위치로 이동"
      >
        {locating ? '…' : '⌖'}
      </button>

      <PlaceInfoCard
        place={selectedPlace}
        detail={placeDetail}
        loading={placeDetailLoading}
        onClose={onClearSelectedPlace}
      />
    </section>
  )
}
