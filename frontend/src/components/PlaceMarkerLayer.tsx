import { useEffect } from 'react'
import { PLACE_CATEGORY_LABELS } from '../constants/placeCategory'
import type { PlaceMapResponse } from '../types/place'

interface PlaceMarkerLayerProps {
  map: KakaoMap | null
  places: PlaceMapResponse[]
  onSelectPlace: (place: PlaceMapResponse) => void
}

export function PlaceMarkerLayer({
  map,
  places,
  onSelectPlace,
}: PlaceMarkerLayerProps) {
  useEffect(() => {
    if (!map || !window.kakao?.maps) {
      return
    }

    const overlays = places.map((place) => {
      const marker = document.createElement('button')
      marker.type = 'button'
      marker.className = `place-marker place-marker--${place.category.toLowerCase()}`
      marker.setAttribute(
        'aria-label',
        `${place.name} ${PLACE_CATEGORY_LABELS[place.category]} 보기`,
      )
      marker.innerHTML = `<span>${PLACE_CATEGORY_LABELS[place.category]}</span>`

      const handleClick = () => onSelectPlace(place)
      marker.addEventListener('click', handleClick)

      const overlay = new window.kakao!.maps.CustomOverlay({
        map,
        position: new window.kakao!.maps.LatLng(place.latitude, place.longitude),
        content: marker,
        yAnchor: 1,
        zIndex: 3,
      })

      return { overlay, marker, handleClick }
    })

    return () => {
      overlays.forEach(({ overlay, marker, handleClick }) => {
        marker.removeEventListener('click', handleClick)
        overlay.setMap(null)
      })
    }
  }, [map, onSelectPlace, places])

  return null
}
