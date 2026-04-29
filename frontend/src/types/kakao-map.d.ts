export {}

declare global {
  interface Window {
    kakao?: KakaoNamespace
  }

  interface KakaoNamespace {
    maps: {
      load(callback: () => void): void
      LatLng: new (latitude: number, longitude: number) => KakaoLatLng
      LatLngBounds: new () => KakaoLatLngBounds
      Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap
      Marker: new (options: KakaoMarkerOptions) => KakaoMarker
      CustomOverlay: new (
        options: KakaoCustomOverlayOptions,
      ) => KakaoCustomOverlay
      services?: {
        Places: new () => KakaoPlaces
        Status: {
          OK: string
          ZERO_RESULT: string
          ERROR: string
        }
      }
      event: {
        addListener(
          target: KakaoMap | KakaoMarker,
          type: string,
          handler: () => void,
        ): void
        removeListener(
          target: KakaoMap | KakaoMarker,
          type: string,
          handler: () => void,
        ): void
      }
    }
  }

  interface KakaoLatLng {
    getLat(): number
    getLng(): number
  }

  interface KakaoLatLngBounds {
    getSouthWest(): KakaoLatLng
    getNorthEast(): KakaoLatLng
  }

  interface KakaoMapOptions {
    center: KakaoLatLng
    level: number
  }

  interface KakaoMap {
    getBounds(): KakaoLatLngBounds
    relayout(): void
    setCenter(latlng: KakaoLatLng): void
    setLevel(level: number): void
  }

  interface KakaoMarkerOptions {
    position: KakaoLatLng
    map?: KakaoMap
    title?: string
  }

  interface KakaoMarker {
    setMap(map: KakaoMap | null): void
  }

  interface KakaoCustomOverlayOptions {
    content: HTMLElement | string
    map?: KakaoMap
    position: KakaoLatLng
    xAnchor?: number
    yAnchor?: number
    zIndex?: number
  }

  interface KakaoCustomOverlay {
    setMap(map: KakaoMap | null): void
    setPosition(position: KakaoLatLng): void
  }

  interface KakaoPlaces {
    keywordSearch(
      keyword: string,
      callback: (
        results: KakaoPlaceSearchResult[],
        status: string,
        pagination: KakaoPagination,
      ) => void,
    ): void
  }

  interface KakaoPagination {
    current: number
    hasNextPage: boolean
    gotoPage(page: number): void
  }

  interface KakaoPlaceSearchResult {
    id: string
    place_name: string
    address_name: string
    road_address_name: string
    x: string
    y: string
  }
}
