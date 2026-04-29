# Frontend Auth/JWT 2차 구현 계획

## 계획 범위

이 문서는 아껴맵 2차 프론트엔드 인증/JWT 연동 계획입니다.

현재 백엔드는 Auth/JWT, `USER`/`ADMIN` 권한 분리, 로그인 사용자 기반 Place CRUD가 구현되어 있습니다. 이번 문서는 계획만 작성하며, 아직 frontend 코드는 구현하지 않습니다.

## 구현 목표

- 회원가입 화면을 추가합니다.
- 로그인 화면을 추가합니다.
- 로그인 성공 시 `accessToken`을 저장합니다.
- Axios 요청에 `Authorization: Bearer {accessToken}` 헤더를 자동 첨부합니다.
- 앱 시작 시 로그인 상태를 복원합니다.
- 로그아웃 기능을 추가합니다.
- 장소 등록은 로그인 사용자만 가능하게 처리합니다.
- 비로그인 상태에서 장소 등록 버튼 클릭 시 로그인 안내 또는 로그인 화면 이동을 제공합니다.
- 내 장소 목록 화면을 추가합니다.
- 내가 등록한 장소 수정/삭제 기능을 추가합니다.
- `ADMIN` 사용자는 승인 대기 장소를 조회하고 승인/반려할 수 있게 합니다.
- 기존 공개 지도 조회 기능은 비회원도 계속 사용할 수 있게 유지합니다.

## 현재 백엔드 인증/권한 구조 요약

공개 API:

```text
POST /api/auth/signup
POST /api/auth/login
GET /api/places
GET /api/places/{placeId}
GET /api/places/map
```

인증 필요 API:

```text
GET /api/auth/me
POST /api/places
GET /api/places/me
PATCH /api/places/{placeId}
DELETE /api/places/{placeId}
```

ADMIN API:

```text
GET /api/admin/places/pending
PATCH /api/admin/places/{placeId}/approve
PATCH /api/admin/places/{placeId}/reject
```

정책:

- 회원가입 사용자는 기본 `USER` 권한입니다.
- `ADMIN` 계정은 로컬 DB에서 `users.role`을 `ADMIN`으로 변경해 사용합니다.
- 공개 지도/목록/상세 조회는 비회원도 접근 가능합니다.
- 장소 등록/내 장소 조회/수정/삭제는 로그인 필요 API입니다.
- 관리자 승인/반려 API는 `ADMIN` 권한이 필요합니다.

## 화면 구성

### 로그인

- 경로: `/login`
- 이메일, 비밀번호 입력
- 로그인 성공 시 `accessToken` 저장 후 `/` 또는 이전 요청 화면으로 이동
- 로그인 실패 시 간단한 오류 안내
- 회원가입 화면으로 이동 링크 제공

### 회원가입

- 경로: `/signup`
- 이메일, 비밀번호, 닉네임 입력
- 가입 성공 후 로그인 화면으로 이동하거나 자동 로그인 여부 검토
- 1차 구현에서는 자동 로그인보다 로그인 화면 이동을 우선합니다.

### 지도 메인

- 경로: `/`
- 기존 Kakao Map, 승인 장소 마커, 현재 위치, 장소 카드 기능 유지
- 비회원도 `GET /api/places/map` 호출 가능
- 상단에 로그인/회원가입 또는 사용자 닉네임/로그아웃/내 장소 메뉴 표시
- `ADMIN`인 경우 관리자 메뉴 표시

### 장소 등록 폼

- 기존 Kakao Places 검색 기반 등록 UX 유지
- 비로그인 상태에서 장소 등록 버튼 클릭 시 로그인 안내 표시
- 정책 후보:
  - 로그인 화면으로 이동하며 `redirect=/` query 저장
  - 또는 작은 안내 모달에서 로그인 버튼 제공
- 로그인 상태에서만 `POST /api/places` 호출
- 등록 성공 후 기존 안내 문구 유지:

```text
장소가 등록되었습니다. 관리자 승인 후 지도에 표시됩니다.
```

### 내 장소 목록

- 경로: `/my/places`
- `GET /api/places/me` 호출
- `DELETED`는 백엔드에서 제외되므로 화면에는 표시하지 않음
- 장소명, 카테고리, 주소, 가격 정보, 상태, 등록/수정일 표시
- 상태별 안내:
  - `PENDING`: 관리자 승인 대기
  - `APPROVED`: 지도 노출 중
  - `REJECTED`: 반려됨, 수정 후 재제출 가능
  - `HIDDEN`: 관리자 판단으로 숨김

### 장소 수정

- 경로 후보: `/my/places/:placeId/edit`
- 기존 장소 등록 폼과 유사한 폼을 재사용하거나 `PlaceEditForm` 분리
- `PATCH /api/places/{placeId}` 호출
- `APPROVED` 장소 수정 시 백엔드 정책에 따라 `PENDING`으로 변경됨
- 수정 완료 후 다음 안내 표시:

```text
장소 정보가 수정되었습니다. 관리자 재승인 후 지도에 다시 표시됩니다.
```

### 장소 삭제

- 내 장소 목록에서 삭제 버튼 제공
- 삭제 전 confirm 모달 또는 브라우저 confirm 사용
- `DELETE /api/places/{placeId}` 호출
- 성공 시 목록에서 제거
- 실제 삭제는 `DELETED` 상태로 변경되는 소프트 삭제입니다.
- 삭제 복구 기능은 이번 단계에서 구현하지 않습니다.

### 관리자 승인/반려

- 경로: `/admin/places/pending`
- `user.role === 'ADMIN'`인 경우에만 메뉴와 접근 허용
- `GET /api/admin/places/pending`으로 승인 대기 장소 조회
- 각 장소에 승인/반려 버튼 제공
- 승인: `PATCH /api/admin/places/{placeId}/approve`
- 반려: `PATCH /api/admin/places/{placeId}/reject`
- 처리 성공 후 목록에서 제거하거나 상태 갱신

## 라우팅 구조 제안

현재 frontend는 React Router가 없는 단일 `App` 구조입니다. 2차 구현에서는 `react-router-dom` 추가를 권장합니다.

```text
/
/login
/signup
/my/places
/my/places/:placeId/edit
/admin/places/pending
```

라우트 보호:

- 공개 라우트: `/`, `/login`, `/signup`
- 인증 필요 라우트: `/my/places`, `/my/places/:placeId/edit`
- ADMIN 필요 라우트: `/admin/places/pending`

구성 후보:

```text
App
├─ AuthProvider
├─ Router
│  ├─ PublicLayout
│  ├─ ProtectedRoute
│  └─ AdminRoute
```

## 컴포넌트 구조 제안

```text
frontend/src/
├─ api/
│  ├─ client.ts
│  ├─ auth.ts
│  ├─ places.ts
│  └─ adminPlaces.ts
├─ auth/
│  ├─ AuthContext.tsx
│  ├─ authStorage.ts
│  ├─ ProtectedRoute.tsx
│  └─ AdminRoute.tsx
├─ pages/
│  ├─ MapPage.tsx
│  ├─ LoginPage.tsx
│  ├─ SignupPage.tsx
│  ├─ MyPlacesPage.tsx
│  ├─ PlaceEditPage.tsx
│  └─ AdminPendingPlacesPage.tsx
├─ components/
│  ├─ AppHeader.tsx
│  ├─ PlaceCreateForm.tsx
│  ├─ PlaceEditForm.tsx
│  ├─ MyPlaceList.tsx
│  └─ AdminPendingPlaceList.tsx
└─ types/
   ├─ auth.ts
   └─ place.ts
```

기존 `MapView`, `PlaceMarkerLayer`, `PlaceInfoCard`, `useKakaoMapScript`, `usePlacesInBounds`는 공개 지도 기능 유지 관점에서 최대한 그대로 둡니다.

## 상태 관리 방식

### accessToken 저장 위치

- 1차 인증 연동에서는 `localStorage`를 사용합니다.
- key 후보:

```text
akkyomap.accessToken
```

주의:

- refresh token은 이번 단계에서 구현하지 않습니다.
- XSS 위험은 인지하되, 포트폴리오 로컬 MVP에서는 구현 단순성을 우선합니다.

### user 정보 저장 방식

`AuthContext`에서 다음 상태를 관리합니다.

```ts
interface AuthState {
  accessToken: string | null
  user: UserResponse | null
  initializing: boolean
}
```

앱 시작 시:

1. `localStorage`에서 accessToken을 읽습니다.
2. 토큰이 있으면 `GET /api/auth/me`를 호출합니다.
3. 성공하면 `user`를 저장하고 로그인 상태로 복원합니다.
4. 실패하면 토큰을 삭제하고 비로그인 상태로 전환합니다.

백엔드에 `/api/auth/me`가 구현되어 있으므로 JWT payload 직접 파싱은 우선 사용하지 않습니다.

### 로그인 상태 관리 방식

`AuthContext` 제공 함수:

```ts
login(email, password)
signup(request)
logout()
refreshMe()
requireLogin(action)
```

로그아웃 시:

- `localStorage` accessToken 삭제
- user 상태 초기화
- 필요 시 `/`로 이동

## Axios 인증 헤더 처리 방식

기존 `apiClient`의 `baseURL: '/api'`와 Vite proxy는 유지합니다.

요청 interceptor:

- `localStorage` 또는 Auth storage helper에서 accessToken 조회
- accessToken이 있으면 `Authorization: Bearer {accessToken}` 추가
- 공개 API에도 토큰이 붙을 수 있으나 동작에는 영향이 없어야 합니다.

응답 interceptor:

- 401 발생 시 accessToken 삭제
- 로그인 필요 안내 이벤트 발생 또는 AuthContext logout 처리
- 403 발생 시 권한 부족 안내 표시

순환 참조를 피하기 위해 `api/client.ts`는 React Context를 직접 import하지 않고, `authStorage.ts` 같은 순수 helper를 참조하는 방향을 권장합니다.

## 401/403 에러 처리 방식

401:

- 저장된 accessToken 삭제
- user 상태 초기화
- “로그인이 필요합니다. 다시 로그인해 주세요.” 안내
- 인증 필요 화면에서는 `/login`으로 이동
- 공개 지도 화면에서는 지도 사용을 막지 않고 안내만 표시

403:

- 토큰은 유지
- “접근 권한이 없습니다.” 안내
- ADMIN 화면 접근 시 `/` 또는 이전 화면으로 이동

## 로그인 필요한 액션 처리 방식

장소 등록 버튼은 비로그인 상태에서도 노출할 수 있습니다.

클릭 시:

- 로그인 상태면 기존 등록 폼 열기
- 비로그인 상태면 안내 표시 후 `/login?redirect=/` 이동

문구 후보:

```text
장소를 등록하려면 로그인이 필요합니다.
```

## API 연동 함수 설계

### auth.ts

```ts
signup(request: SignupRequest): Promise<UserResponse>
login(request: LoginRequest): Promise<TokenResponse>
fetchMe(): Promise<UserResponse>
```

### places.ts

기존 공개 함수 유지:

```ts
fetchPlacesInBounds(bounds): Promise<PlaceMapResponse[]>
fetchPlaceDetail(placeId): Promise<PlaceDetailResponse>
```

인증 필요 함수 추가:

```ts
createPlace(request): Promise<PlaceDetailResponse>
fetchMyPlaces(): Promise<MyPlaceResponse[]>
updateMyPlace(placeId, request): Promise<PlaceDetailResponse>
deleteMyPlace(placeId): Promise<PlaceStatusResponse>
```

### adminPlaces.ts

```ts
fetchPendingPlaces(): Promise<PlaceResponse[]>
approvePlace(placeId): Promise<PlaceStatusResponse>
rejectPlace(placeId): Promise<PlaceStatusResponse>
```

`GET /api/admin/places`는 백엔드 구현 여부를 다시 확인한 뒤 선택 사용합니다.

## TypeScript 타입 설계

### auth.ts

```ts
export type UserRole = 'USER' | 'ADMIN'

export interface SignupRequest {
  email: string
  password: string
  nickname: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

export interface UserResponse {
  id: number
  email: string
  nickname: string
  role: UserRole
}
```

### place.ts

기존 `PlaceStatus`에 `DELETED`를 추가합니다.

```ts
export type PlaceStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'HIDDEN'
  | 'DELETED'
```

추가 타입:

```ts
export type PlaceUpdateRequest = PlaceCreateRequest

export interface MyPlaceResponse {
  id: number
  name: string
  category: PlaceCategory
  address: string
  priceInfo: string | null
  status: PlaceStatus
  createdAt: string
  updatedAt: string
}

export interface PlaceStatusResponse {
  id: number
  status: PlaceStatus
}
```

## 내 장소 수정/삭제 UX

- 내 장소 목록은 상태별 badge로 현재 상태를 보여줍니다.
- `APPROVED` 장소 수정 버튼에는 재승인 안내를 함께 표시합니다.
- 수정 폼은 기존 장소 등록 폼의 필드와 Kakao Places 검색 흐름을 가능한 재사용합니다.
- 삭제는 즉시 실행하지 않고 확인 단계를 둡니다.
- 삭제 성공 시 목록에서 제거하고 “장소가 삭제되었습니다.” 안내를 표시합니다.
- 신규 등록/수정/삭제 후 공개 지도 마커 목록에 임의로 추가하지 않습니다. 공개 지도는 계속 `GET /api/places/map` 결과만 신뢰합니다.

## ADMIN 화면 접근 제어 방식

- `user.role === 'ADMIN'`인 경우에만 관리자 메뉴 표시
- `AdminRoute`에서 `user.role` 검사
- 비로그인 사용자는 `/login`으로 이동
- 일반 USER는 권한 부족 안내 후 `/`로 이동
- 403 응답도 별도로 처리해 클라이언트 상태와 서버 권한 검증이 어긋나도 안전하게 막습니다.

## 기존 지도 조회 기능 유지 전략

- `GET /api/places/map`은 계속 비회원 접근 가능 API로 호출합니다.
- `usePlacesInBounds`, `MapView`, `PlaceMarkerLayer`의 공개 조회 흐름은 최소 변경합니다.
- Axios interceptor가 토큰을 붙이더라도 비회원일 때는 헤더 없이 정상 호출되어야 합니다.
- Kakao Map SDK 로딩, `.env`의 `VITE_KAKAO_MAP_APP_KEY`, `libraries=services`, Vite proxy `/api` 설정은 유지합니다.
- 백엔드 CORS는 이번 단계에서 수정하지 않습니다.

## 구현 순서 체크리스트

사용자가 구현을 승인한 뒤 아래 순서로 진행합니다.

- [ ] `react-router-dom` 의존성 추가 여부를 확정합니다.
- [ ] `types/auth.ts`와 인증 관련 타입을 추가합니다.
- [ ] `types/place.ts`에 `DELETED`, `PlaceUpdateRequest`, `MyPlaceResponse`, `PlaceStatusResponse`를 추가합니다.
- [ ] `authStorage.ts`를 추가해 localStorage accessToken 읽기/쓰기/삭제를 캡슐화합니다.
- [ ] `api/client.ts`에 Authorization request interceptor를 추가합니다.
- [ ] `api/client.ts`에 401/403 response 처리 방향을 추가합니다.
- [ ] `api/auth.ts`를 추가합니다.
- [ ] `api/places.ts`에 내 장소 조회/수정/삭제 함수를 추가합니다.
- [ ] `api/adminPlaces.ts`를 추가합니다.
- [ ] `AuthContext`와 `AuthProvider`를 추가합니다.
- [ ] 앱 시작 시 accessToken과 `/api/auth/me`로 로그인 상태를 복원합니다.
- [ ] `LoginPage`와 `SignupPage`를 추가합니다.
- [ ] `AppHeader`를 추가해 로그인/로그아웃/내 장소/관리자 메뉴를 표시합니다.
- [ ] 기존 지도 화면을 `MapPage`로 분리합니다.
- [ ] 장소 등록 버튼의 로그인 필요 처리를 추가합니다.
- [ ] `MyPlacesPage`를 추가합니다.
- [ ] `PlaceEditPage` 또는 `PlaceEditForm`을 추가합니다.
- [ ] 장소 삭제 확인 UX를 추가합니다.
- [ ] `AdminPendingPlacesPage`를 추가합니다.
- [ ] `ProtectedRoute`, `AdminRoute`를 추가합니다.
- [ ] 기존 지도 조회, Kakao Places 검색, 장소 등록 성공 안내가 깨지지 않는지 확인합니다.
- [ ] `npm run build`를 실행해 타입과 빌드를 검증합니다.

## 이번 단계에서 제외할 기능

- refresh token
- OAuth 로그인
- 이메일 인증
- 비밀번호 재설정
- 리뷰
- 신고
- 즐겨찾기
- MCP 기반 AI 장소 검색 도구
- QueryDSL
- 배포
- CI/CD
- 백엔드 코드 수정
- 백엔드 CORS 설정 추가

## 예상 위험 요소

- 기존 프론트 장소 등록은 JWT 없이 호출하므로 인증 연동 전까지 401이 발생할 수 있습니다.
- Axios interceptor에서 401 처리와 AuthContext 상태 갱신이 순환 참조를 만들 수 있습니다.
- 앱 시작 시 `/api/auth/me` 호출 중 화면 깜빡임이 생길 수 있어 `initializing` 상태가 필요합니다.
- `localStorage` accessToken 저장은 XSS에 취약하므로 운영 전 보안 재검토가 필요합니다.
- `APPROVED` 장소 수정 후 `PENDING`으로 바뀌면 지도에서 사라지므로 사용자 안내가 필요합니다.
- `ADMIN` 메뉴 노출은 클라이언트 편의 기능일 뿐이며, 실제 권한은 백엔드 403으로 최종 방어해야 합니다.
- 기존 Kakao Map 컴포넌트와 라우팅 도입이 충돌하지 않도록 지도 컴포넌트 상태 보존 전략을 확인해야 합니다.
