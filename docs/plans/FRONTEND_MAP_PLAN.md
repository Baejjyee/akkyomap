# 프론트엔드 지도 1차 구현 계획

## 계획 범위

이 문서는 아껴맵 프론트엔드 1차 구현 계획입니다.

이번 단계의 목표는 React + Vite + TypeScript 기반 프론트엔드 프로젝트를 준비하고, Kakao Map 위에 백엔드의 승인된 장소 마커를 표시하며, 사용자가 장소를 제보할 수 있는 최소 화면을 만드는 것입니다.

아직 구현 단계가 아니므로 이 문서에서는 생성할 파일, 컴포넌트 구조, API 연동 방식, 환경변수 관리 방식만 정의합니다.

## 구현 목표

프론트엔드 1차 구현의 목표는 다음 흐름을 완성하는 것입니다.

```text
프론트엔드 앱 실행
-> Kakao Map 로드
-> 현재 지도 영역 좌표 계산
-> GET /api/places/map 호출
-> APPROVED 장소만 마커로 표시
-> 마커 클릭 시 장소 정보 카드 표시
-> 장소 등록 폼 제출
-> POST /api/places 호출
-> 등록 완료 후 PENDING 안내 표시
```

구현 후 만족해야 하는 조건은 다음과 같습니다.

- `frontend/` 아래에 React + Vite + TypeScript 프로젝트가 생성됩니다.
- Kakao Map JavaScript SDK는 API 키를 코드에 직접 작성하지 않고 `.env`의 `VITE_KAKAO_MAP_APP_KEY`로 로드합니다.
- 초기 로컬 개발에서는 백엔드 CORS를 수정하지 않고 Vite 개발 서버 proxy로 `/api` 요청을 백엔드에 전달합니다.
- 지도 화면은 `GET /api/places/map` API를 사용해 승인된 장소만 마커로 표시합니다.
- 마커 클릭 시 장소명, 카테고리, 가격 정보를 카드로 보여줍니다.
- 장소 등록 폼은 `POST /api/places` API를 호출합니다.
- 장소 등록 성공 후에는 등록된 장소가 `PENDING` 상태라 지도에 바로 표시되지 않는다는 안내 문구를 보여줍니다.
- 로그인/JWT 없이 동작합니다.
- 리뷰, 신고, MCP, QueryDSL, Docker, CI/CD는 포함하지 않습니다.

## 화면 구성

초기 화면은 별도 랜딩 페이지 없이 지도 사용 화면을 바로 보여줍니다.

### 메인 지도 화면

구성 요소:

- 상단 또는 좌측의 간단한 서비스명 영역
- 지도 영역
- 장소 등록 버튼
- 선택된 장소 정보 카드
- 등록 성공/실패 안내 메시지

지도 동작:

- 최초 진입 시 기본 중심 좌표를 사용합니다.
- Kakao Map이 로드되면 지도 인스턴스를 생성합니다.
- 지도 이동 또는 확대/축소가 끝난 뒤 현재 지도 bounds를 읽어 `GET /api/places/map`을 호출합니다.
- 응답으로 받은 장소 목록을 지도 마커로 표시합니다.
- 기존 마커는 새 조회 결과에 맞춰 정리한 뒤 다시 렌더링합니다.

### 장소 정보 카드

마커 클릭 시 표시합니다.

표시 필드:

- 장소명 `name`
- 카테고리 `category`
- 가격 정보 `priceInfo`

카테고리는 프론트엔드에서 한글 표시명으로 변환합니다.

예시:

| API 값 | 화면 표시 |
| --- | --- |
| `RESTAURANT` | 식당 |
| `CAFE` | 카페 |
| `STUDY_SPACE` | 공부공간 |
| `PRINT_COPY` | 프린트/복사 |
| `CONVENIENCE` | 편의시설 |

### 장소 등록 폼

등록 버튼을 누르면 폼 패널 또는 모달을 표시합니다.

입력 필드:

- 장소명
- 카테고리
- 주소
- 위도
- 경도
- 가격 정보
- 설명

초기 구현에서는 주소 검색 또는 지도 클릭 좌표 선택을 필수로 만들지 않습니다. 우선 직접 입력 방식으로 백엔드 등록 흐름을 검증합니다.

등록 성공 후 안내:

```text
장소가 등록되었습니다. 관리자 승인 후 지도에 표시됩니다.
```

이 안내는 `POST /api/places` 응답의 `status`가 `PENDING`임을 기준으로 보여줍니다.

## 생성할 파일 경로

구현 단계에서 생성할 프론트엔드 파일 구조는 다음을 기준으로 합니다.

```text
frontend/
├─ package.json
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ .env.example
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ styles.css
   ├─ api/
   │  ├─ client.ts
   │  └─ places.ts
   ├─ components/
   │  ├─ MapView.tsx
   │  ├─ PlaceMarkerLayer.tsx
   │  ├─ PlaceInfoCard.tsx
   │  └─ PlaceCreateForm.tsx
   ├─ constants/
   │  └─ placeCategory.ts
   ├─ hooks/
   │  ├─ useKakaoMapScript.ts
   │  └─ usePlacesInBounds.ts
   ├─ types/
   │  ├─ kakao-map.d.ts
   │  └─ place.ts
   └─ utils/
      └─ mapBounds.ts
```

필요한 경우 구현 중 구조를 조금 줄일 수 있습니다. 다만 API 호출, 타입, 지도 로딩, UI 컴포넌트는 서로 분리합니다.

## 컴포넌트 구조

```text
App
├─ MapView
│  ├─ PlaceMarkerLayer
│  └─ PlaceInfoCard
└─ PlaceCreateForm
```

### App

책임:

- 전체 레이아웃 구성
- 선택된 장소 상태 관리
- 등록 폼 열림/닫힘 상태 관리
- 등록 성공 메시지 상태 관리

### MapView

책임:

- Kakao Map SDK 로딩 상태 처리
- 지도 DOM 컨테이너 제공
- Kakao Map 인스턴스 생성
- 지도 bounds 변경 시 장소 목록 조회 트리거

### PlaceMarkerLayer

책임:

- `PlaceMapResponse` 목록을 Kakao Map Marker로 변환
- 마커 클릭 이벤트 연결
- 장소 목록 변경 시 기존 마커 정리

### PlaceInfoCard

책임:

- 선택된 장소의 요약 정보 표시
- 장소명, 카테고리 표시명, 가격 정보 렌더링

### PlaceCreateForm

책임:

- 장소 등록 입력값 관리
- 클라이언트 기본 검증
- `POST /api/places` 호출
- 등록 성공 시 부모 컴포넌트에 성공 상태 전달

## API 연동 방식

API 클라이언트는 Axios를 사용합니다.

초기 로컬 개발에서는 백엔드 CORS를 수정하지 않고 Vite proxy를 우선 사용합니다. 따라서 브라우저에서 API를 호출할 때는 백엔드 전체 URL을 직접 사용하지 않고 `/api` 상대 경로를 사용합니다.

공통 클라이언트:

```text
frontend/src/api/client.ts
```

역할:

- Axios 인스턴스 생성
- `baseURL`은 기본적으로 `/api` 사용
- JSON 요청/응답 처리

예상 방향:

```ts
axios.create({
  baseURL: '/api',
});
```

Vite 개발 서버 proxy:

```text
frontend/vite.config.ts
```

예상 설정 방향:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:8080',
  },
}
```

Place API:

```text
frontend/src/api/places.ts
```

구현할 함수:

- `fetchPlacesInBounds(bounds: MapBounds): Promise<PlaceMapResponse[]>`
- `createPlace(request: PlaceCreateRequest): Promise<PlaceDetailResponse>`

### GET /api/places/map

요청:

```text
GET /api/places/map?swLat={number}&swLng={number}&neLat={number}&neLng={number}
```

프론트엔드에서는 Kakao Map bounds에서 남서쪽 좌표와 북동쪽 좌표를 추출해 전달합니다.

응답 타입:

```ts
PlaceMapResponse[]
```

응답 필드:

- `id`
- `name`
- `category`
- `latitude`
- `longitude`
- `priceInfo`

주의:

- 백엔드는 `APPROVED` 상태 장소만 반환합니다.
- `PENDING`, `REJECTED`, `HIDDEN` 장소는 지도에 표시되지 않습니다.

### POST /api/places

요청:

```text
POST /api/places
Content-Type: application/json
```

요청 필드:

- `name`
- `category`
- `address`
- `latitude`
- `longitude`
- `priceInfo`
- `description`

응답 타입:

```ts
PlaceDetailResponse
```

응답의 `status`는 신규 등록 직후 `PENDING`입니다.

프론트엔드 처리:

- 등록 성공 메시지를 표시합니다.
- 지도 마커 목록에 방금 등록한 장소를 임의로 추가하지 않습니다.
- 필요하면 현재 지도 bounds 기준으로 목록을 다시 조회할 수 있지만, 신규 장소는 승인 전이므로 나타나지 않는 것이 정상입니다.

## TypeScript 타입 설계

```ts
export type PlaceCategory =
  | 'RESTAURANT'
  | 'CAFE'
  | 'STUDY_SPACE'
  | 'PRINT_COPY'
  | 'CONVENIENCE';

export type PlaceStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'HIDDEN';

export interface PlaceCreateRequest {
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  priceInfo?: string;
  description?: string;
}

export interface PlaceMapResponse {
  id: number;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  priceInfo: string | null;
}

export interface PlaceDetailResponse {
  id: number;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  priceInfo: string | null;
  description: string | null;
  status: PlaceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}
```

Kakao Map 전역 타입은 `types/kakao-map.d.ts`에서 최소한만 선언합니다.

초기 구현에서는 필요한 타입만 선언합니다.

- `window.kakao`
- `kakao.maps.Map`
- `kakao.maps.LatLng`
- `kakao.maps.LatLngBounds`
- `kakao.maps.Marker`
- `kakao.maps.event.addListener`

## Kakao Map API 환경변수 관리 방식

Kakao Map 키는 Kakao Developers에서 발급받은 JavaScript 키를 사용합니다. 이 키는 코드에 직접 작성하지 않습니다.

`.env.example`:

```text
VITE_KAKAO_MAP_APP_KEY=your_kakao_javascript_key
```

실제 로컬 실행 시 개발자는 `frontend/.env`를 만들고 값을 입력합니다.

```text
VITE_KAKAO_MAP_APP_KEY=실제_카카오_JavaScript_키
```

`VITE_API_BASE_URL`은 이번 단계의 필수 환경변수가 아닙니다. 초기 로컬 개발에서는 Axios `baseURL: '/api'`와 Vite proxy를 사용합니다. 배포나 별도 API 서버 주소가 필요한 단계에서 선택값으로 다시 검토합니다.

Kakao Map SDK 로드 방식:

- `useKakaoMapScript` 훅에서 `VITE_KAKAO_MAP_APP_KEY`를 읽습니다.
- 이미 스크립트가 로드되어 있으면 중복 삽입하지 않습니다.
- SDK URL은 다음 형식을 사용합니다.

```text
https://dapi.kakao.com/v2/maps/sdk.js?appkey=${VITE_KAKAO_MAP_APP_KEY}&autoload=false
```

스크립트 로드 후 `window.kakao.maps.load()` 안에서 지도 인스턴스를 생성합니다.

주의:

- `.env`는 커밋하지 않습니다.
- `.env.example`만 커밋합니다.
- Kakao Developers 콘솔에서 로컬 도메인 `http://localhost:5173` 등록이 필요합니다.

## 백엔드 CORS 필요 여부

초기 로컬 개발에서는 백엔드 CORS 설정을 추가하지 않습니다.

개발 환경에서 프론트엔드는 Vite 기본 포트인 `http://localhost:5173`에서 실행되고, 백엔드는 `http://localhost:8080`에서 실행됩니다.

브라우저 기준으로 origin이 다르기 때문에 프론트엔드가 백엔드 API를 직접 호출하면 CORS 허용이 필요합니다. 하지만 이번 단계에서는 백엔드 코드를 변경하지 않기 위해 Vite 개발 서버 proxy를 사용합니다.

`vite.config.ts`에서 `/api` 요청을 `http://localhost:8080`으로 프록시합니다.

예상 설정 방향:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:8080',
  },
}
```

장점:

- 백엔드 CORS 설정 없이 로컬 개발을 시작할 수 있습니다.
- 이번 프론트엔드 1차 구현 범위를 프론트엔드 안으로 제한하기 쉽습니다.

이번 단계의 결정:

- Vite proxy를 우선 사용합니다.
- 백엔드 CORS 설정은 추가하지 않습니다.
- 이후 배포 또는 백엔드-프론트 분리 운영 단계에서 백엔드 CORS 설정을 별도 계획으로 검토합니다.

## 구현 순서 체크리스트

아래 순서는 사용자가 구현을 승인한 뒤 진행합니다.

- [ ] `frontend/`에 React + Vite + TypeScript 프로젝트를 생성합니다.
- [ ] Axios 의존성을 추가합니다.
- [ ] `.env.example`에 필수값인 `VITE_KAKAO_MAP_APP_KEY` 예시를 작성합니다.
- [ ] `vite.config.ts`에 `/api` -> `http://localhost:8080` proxy 설정을 추가합니다.
- [ ] `types/place.ts`에 백엔드 DTO와 맞춘 TypeScript 타입을 정의합니다.
- [ ] `api/client.ts`와 `api/places.ts`를 작성합니다.
- [ ] `useKakaoMapScript` 훅으로 Kakao Map SDK 로딩을 구현합니다.
- [ ] `MapView`에서 Kakao Map 인스턴스를 생성합니다.
- [ ] 지도 bounds를 `MapBounds`로 변환하는 유틸을 작성합니다.
- [ ] 지도 이동 완료 시 `GET /api/places/map`을 호출합니다.
- [ ] `PlaceMarkerLayer`에서 승인된 장소 마커를 표시합니다.
- [ ] 마커 클릭 시 `PlaceInfoCard`에 장소명, 카테고리, 가격 정보를 표시합니다.
- [ ] `PlaceCreateForm`에서 장소 등록 폼을 구현합니다.
- [ ] 폼 제출 시 `POST /api/places`를 호출합니다.
- [ ] 등록 성공 후 `PENDING` 안내 문구를 표시합니다.
- [ ] 신규 등록 장소를 지도에 즉시 추가하지 않는 동작을 확인합니다.
- [ ] `npm run build`로 TypeScript 빌드를 확인합니다.
- [ ] 로컬에서 백엔드와 프론트엔드를 함께 실행해 지도 조회와 장소 등록 흐름을 확인합니다.

## 이번 단계에서 제외할 기능

이번 프론트엔드 1차 구현에서는 다음을 만들지 않습니다.

- 로그인
- JWT 인증
- USER / ADMIN 권한 분리
- 관리자 승인/반려 화면
- 리뷰 작성 또는 리뷰 목록
- 신고 기능
- 숨김/복구 기능
- 즐겨찾기
- 내가 등록한 장소 조회
- 가격 변경 제보
- 거리순 정렬
- 추천순 정렬
- Kakao 장소 검색 API 연동
- 주소 검색 자동완성
- 지도 클릭으로 좌표 자동 입력
- MCP 기반 AI 장소 검색 도구
- QueryDSL
- Docker
- CI/CD
- 운영 배포 설정

## 검증 계획

구현 후 확인할 항목은 다음과 같습니다.

- 프론트엔드 앱이 `npm run dev`로 실행됩니다.
- Kakao Map SDK가 `.env`의 키로 로드됩니다.
- API 키가 소스 코드에 직접 포함되지 않습니다.
- 백엔드가 실행 중일 때 지도 bounds 기준으로 `GET /api/places/map` 요청이 발생합니다.
- 승인된 장소 응답이 마커로 표시됩니다.
- 마커 클릭 시 장소 정보 카드가 표시됩니다.
- 장소 등록 폼 제출 시 `POST /api/places` 요청이 발생합니다.
- 등록 성공 후 `관리자 승인 후 지도에 표시됩니다` 안내가 보입니다.
- 등록 직후 해당 장소가 지도 마커로 바로 추가되지 않습니다.
