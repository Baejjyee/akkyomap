import { useState } from 'react'
import { createPlace } from '../api/places'
import { PLACE_CATEGORY_OPTIONS } from '../constants/placeCategory'
import { useKakaoMapScript } from '../hooks/useKakaoMapScript'
import type { PlaceCategory, PlaceCreateRequest } from '../types/place'
import { normalizeCoordinate } from '../utils/coordinates'
import type { FormEvent } from 'react'

interface PlaceCreateFormProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const INITIAL_FORM: PlaceCreateRequest = {
  name: '',
  category: 'RESTAURANT',
  address: '',
  latitude: 37.5665,
  longitude: 126.978,
  priceInfo: '',
  description: '',
}

export function PlaceCreateForm({
  open,
  onClose,
  onCreated,
}: PlaceCreateFormProps) {
  const [form, setForm] = useState<PlaceCreateRequest>(INITIAL_FORM)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<KakaoPlaceSearchResult[]>(
    [],
  )
  const [selectedKakaoPlace, setSelectedKakaoPlace] =
    useState<KakaoPlaceSearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const kakaoScriptStatus = useKakaoMapScript()

  if (!open) {
    return null
  }

  const updateField = (
    field: keyof PlaceCreateRequest,
    value: string | number,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSearch = () => {
    const keyword = searchKeyword.trim()
    const kakao = window.kakao
    const kakaoMaps = kakao?.maps
    const kakaoServices = kakaoMaps?.services

    if (!keyword) {
      setSearchError('검색어를 입력해 주세요.')
      setSearchResults([])
      return
    }

    if (kakaoScriptStatus === 'loading' || kakaoScriptStatus === 'idle') {
      setSearchError('Kakao Places 검색을 준비 중입니다. 잠시 후 다시 시도해 주세요.')
      setSearchResults([])
      return
    }

    if (kakaoScriptStatus === 'missing-services') {
      setSearchError(
        'Kakao SDK가 services 라이브러리 없이 로드되었습니다. 페이지를 새로고침한 뒤 다시 검색해 주세요.',
      )
      setSearchResults([])
      return
    }

    if (!kakao || !kakaoMaps || !kakaoServices?.Places) {
      setSearchError(
        'Kakao Places 검색을 사용할 수 없습니다. SDK URL에 libraries=services가 포함되어 있는지 확인해 주세요.',
      )
      setSearchResults([])
      return
    }

    setSearching(true)
    setSearchError(null)

    const places = new kakaoServices.Places()
    places.keywordSearch(keyword, (results, status) => {
      setSearching(false)

      if (status === kakaoServices.Status.OK) {
        setSearchResults(results.slice(0, 6))
        return
      }

      setSearchResults([])
      if (status === kakaoServices.Status.ZERO_RESULT) {
        setSearchError('검색 결과가 없습니다.')
        return
      }

      setSearchError('장소 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    })
  }

  const selectKakaoPlace = (place: KakaoPlaceSearchResult) => {
    const latitude = normalizeCoordinate(place.y)
    const longitude = normalizeCoordinate(place.x)
    const address = place.road_address_name || place.address_name

    if (latitude === null || longitude === null) {
      setSearchError('선택한 장소의 좌표를 사용할 수 없습니다.')
      return
    }

    setForm((current) => ({
      ...current,
      name: place.place_name,
      address,
      latitude,
      longitude,
    }))
    setSelectedKakaoPlace(place)
    setSearchError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const request: PlaceCreateRequest = {
      ...form,
      name: form.name.trim(),
      address: form.address.trim(),
      priceInfo: form.priceInfo?.trim() || undefined,
      description: form.description?.trim() || undefined,
    }

    try {
      await createPlace(request)
      setForm(INITIAL_FORM)
      setSearchKeyword('')
      setSearchResults([])
      setSelectedKakaoPlace(null)
      onCreated()
      onClose()
    } catch {
      setError('장소 등록에 실패했습니다. 입력값을 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-panel" role="dialog" aria-modal="true">
      <form className="place-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <div>
            <p className="eyebrow">장소 제보</p>
            <h2>새 절약 장소 등록</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="장소 등록 닫기"
          >
            ×
          </button>
        </div>

        <section className="place-search" aria-label="Kakao 장소 검색">
          <label>
            장소 검색
            <div className="search-row">
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearch()
                  }
                }}
                placeholder="장소명 또는 주소를 검색하세요."
              />
              <button
                type="button"
                className="secondary-button"
                onClick={handleSearch}
                disabled={searching}
              >
                {searching ? '검색 중' : '검색'}
              </button>
            </div>
          </label>

          {searchError && <p className="form-error">{searchError}</p>}

          {searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map((place) => {
                const address = place.road_address_name || place.address_name
                const selected = selectedKakaoPlace?.id === place.id

                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      className={`search-result${selected ? ' search-result--selected' : ''}`}
                      onClick={() => selectKakaoPlace(place)}
                    >
                      <span>
                        <strong>{place.place_name}</strong>
                        <small>{address || '주소 정보 없음'}</small>
                      </span>
                      <em>{selected ? '선택됨' : '선택'}</em>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {selectedKakaoPlace && (
            <div className="selected-place">
              <span>선택한 장소</span>
              <strong>{selectedKakaoPlace.place_name}</strong>
              <small>
                {selectedKakaoPlace.road_address_name ||
                  selectedKakaoPlace.address_name}
              </small>
            </div>
          )}
        </section>

        <label>
          장소명
          <input
            required
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="예: 학생분식"
          />
        </label>

        <label>
          카테고리
          <select
            value={form.category}
            onChange={(event) =>
              updateField('category', event.target.value as PlaceCategory)
            }
          >
            {PLACE_CATEGORY_OPTIONS.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          주소
          <input
            required
            value={form.address}
            onChange={(event) => updateField('address', event.target.value)}
            placeholder="예: 서울시 중구 세종대로 110"
          />
        </label>

        <div className="coordinate-grid">
          <label>
            위도
            <input
              required
              type="number"
              min="-90"
              max="90"
              step="any"
              value={form.latitude}
              onChange={(event) =>
                updateField(
                  'latitude',
                  normalizeCoordinate(event.target.value) ?? 0,
                )
              }
            />
          </label>

          <label>
            경도
            <input
              required
              type="number"
              min="-180"
              max="180"
              step="any"
              value={form.longitude}
              onChange={(event) =>
                updateField(
                  'longitude',
                  normalizeCoordinate(event.target.value) ?? 0,
                )
              }
            />
          </label>
        </div>

        <label>
          가격 정보
          <input
            value={form.priceInfo}
            onChange={(event) => updateField('priceInfo', event.target.value)}
            placeholder="예: 김밥 3,000원"
          />
        </label>

        <label>
          설명
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="운영 시간, 좌석, 이용 팁 등을 적어주세요."
            rows={4}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? '등록 중' : '등록하기'}
        </button>
      </form>
    </div>
  )
}
