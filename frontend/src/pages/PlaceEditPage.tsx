import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { updateMyPlace } from '../api/places'
import { PLACE_CATEGORY_OPTIONS } from '../constants/placeCategory'
import { useKakaoMapScript } from '../hooks/useKakaoMapScript'
import type {
  MyPlaceResponse,
  PlaceCategory,
  PlaceUpdateRequest,
} from '../types/place'
import { normalizeCoordinate } from '../utils/coordinates'
import type { FormEvent } from 'react'

interface LocationState {
  place?: MyPlaceResponse
}

const DEFAULT_FORM: PlaceUpdateRequest = {
  name: '',
  category: 'RESTAURANT',
  address: '',
  latitude: 37.5665,
  longitude: 126.978,
  priceInfo: '',
  description: '',
}

export function PlaceEditPage() {
  const { placeId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null
  const initialPlace = state?.place
  const [form, setForm] = useState<PlaceUpdateRequest>(() => ({
    ...DEFAULT_FORM,
    name: initialPlace?.name ?? '',
    category: initialPlace?.category ?? 'RESTAURANT',
    address: initialPlace?.address ?? '',
    priceInfo: initialPlace?.priceInfo ?? '',
  }))
  const [searchKeyword, setSearchKeyword] = useState(initialPlace?.name ?? '')
  const [searchResults, setSearchResults] = useState<KakaoPlaceSearchResult[]>(
    [],
  )
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const kakaoScriptStatus = useKakaoMapScript()

  const updateField = (
    field: keyof PlaceUpdateRequest,
    value: string | number,
  ) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSearch = () => {
    const keyword = searchKeyword.trim()
    const kakaoServices = window.kakao?.maps?.services

    if (!keyword) {
      setSearchError('검색어를 입력해 주세요.')
      return
    }

    if (kakaoScriptStatus !== 'ready' || !kakaoServices?.Places) {
      setSearchError('Kakao Places 검색을 준비 중입니다. 잠시 후 다시 시도해 주세요.')
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
      setSearchError(
        status === kakaoServices.Status.ZERO_RESULT
          ? '검색 결과가 없습니다.'
          : '장소 검색에 실패했습니다.',
      )
    })
  }

  const selectKakaoPlace = (place: KakaoPlaceSearchResult) => {
    const latitude = normalizeCoordinate(place.y)
    const longitude = normalizeCoordinate(place.x)
    if (latitude === null || longitude === null) {
      setSearchError('선택한 장소의 좌표를 사용할 수 없습니다.')
      return
    }
    setForm((current) => ({
      ...current,
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      latitude,
      longitude,
    }))
    setSearchError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!placeId) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await updateMyPlace(Number(placeId), {
        ...form,
        name: form.name.trim(),
        address: form.address.trim(),
        priceInfo: form.priceInfo?.trim() || undefined,
        description: form.description?.trim() || undefined,
      })
      navigate('/my/places', {
        state: {
          notice: '장소 정보가 수정되었습니다. 관리자 재승인 후 지도에 다시 표시됩니다.',
        },
      })
    } catch {
      setError('장소 수정에 실패했습니다. 입력값을 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">장소 수정</p>
          <h2>{initialPlace?.name ?? '내 장소 수정'}</h2>
        </div>
        <Link to="/my/places" className="secondary-button">
          목록
        </Link>
      </div>

      <form className="place-form page-form" onSubmit={handleSubmit}>
        <section className="place-search" aria-label="Kakao 장소 검색">
          <label>
            장소 다시 검색
            <div className="search-row">
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="장소명 또는 주소"
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
              {searchResults.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    className="search-result"
                    onClick={() => selectKakaoPlace(place)}
                  >
                    <span>
                      <strong>{place.place_name}</strong>
                      <small>
                        {place.road_address_name ||
                          place.address_name ||
                          '주소 정보 없음'}
                      </small>
                    </span>
                    <em>선택</em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <label>
          장소명
          <input
            required
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
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
          />
        </label>

        <label>
          설명
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows={4}
          />
        </label>

        {initialPlace?.status === 'APPROVED' && (
          <div className="inline-notice">
            승인된 장소를 수정하면 관리자 재승인 전까지 지도에서 숨겨집니다.
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? '수정 중' : '수정하기'}
        </button>
      </form>
    </section>
  )
}
