# 아껴맵 API 명세 초안

## 공통 응답 형식

성공 응답:

```json
{
  "success": true,
  "message": "요청이 성공했습니다.",
  "data": {}
}
```

실패 응답:

```json
{
  "success": false,
  "message": "장소를 찾을 수 없습니다.",
  "data": null
}
```

초기 구현에서는 단순 예외로 시작할 수 있지만, 기능이 늘어나면 공통 예외 처리와 공통 응답 객체를 도입합니다.

## Place API

### 장소 등록

```http
POST /api/places
```

사용자가 장소를 등록합니다. 등록된 장소는 기본적으로 `PENDING` 상태가 됩니다.

Request Body:

```json
{
  "name": "학생식당",
  "category": "RESTAURANT",
  "address": "부산광역시 남구 ...",
  "latitude": 35.1,
  "longitude": 129.0,
  "priceInfo": "김치찌개 6000원",
  "description": "점심이 저렴한 식당"
}
```

Response Body:

```json
{
  "id": 1,
  "name": "학생식당",
  "category": "RESTAURANT",
  "address": "부산광역시 남구 ...",
  "latitude": 35.1,
  "longitude": 129.0,
  "priceInfo": "김치찌개 6000원",
  "description": "점심이 저렴한 식당",
  "status": "PENDING",
  "createdAt": "2026-04-29T16:00:00",
  "updatedAt": "2026-04-29T16:00:00"
}
```

예외 상황:

- 필수 값 누락
- 지원하지 않는 카테고리
- 위도 또는 경도 형식 오류

권한 조건:

- 초기 MVP에서는 인증 없이 호출 가능합니다.
- 추후 로그인 도입 시 일반 사용자 권한이 필요합니다.

### 승인된 장소 목록 조회

```http
GET /api/places
```

승인된 장소 목록을 조회합니다. 기본적으로 `APPROVED` 상태의 장소만 반환합니다.

Response Body:

```json
[
  {
    "id": 1,
    "name": "학생식당",
    "category": "RESTAURANT",
    "address": "부산광역시 남구 ...",
    "priceInfo": "김치찌개 6000원",
    "status": "APPROVED"
  }
]
```

권한 조건:

- 인증 없이 호출 가능합니다.

### 장소 상세 조회

```http
GET /api/places/{placeId}
```

장소 상세 정보를 조회합니다.

Response Body:

```json
{
  "id": 1,
  "name": "학생식당",
  "category": "RESTAURANT",
  "address": "부산광역시 남구 ...",
  "latitude": 35.1,
  "longitude": 129.0,
  "priceInfo": "김치찌개 6000원",
  "description": "점심이 저렴한 식당",
  "status": "APPROVED",
  "createdAt": "2026-04-29T16:00:00",
  "updatedAt": "2026-04-29T16:10:00"
}
```

예외 상황:

- 존재하지 않는 장소 ID

권한 조건:

- 인증 없이 호출 가능합니다.

### 지도 마커 장소 조회

```http
GET /api/places/map?swLat=35.1&swLng=129.0&neLat=35.2&neLng=129.2
```

현재 지도 화면 범위 안에 있는 승인된 장소만 조회합니다.

Query Parameters:

| 이름 | 설명 |
| --- | --- |
| swLat | 남서쪽 위도 |
| swLng | 남서쪽 경도 |
| neLat | 북동쪽 위도 |
| neLng | 북동쪽 경도 |

Response Body:

```json
[
  {
    "id": 1,
    "name": "학생식당",
    "category": "RESTAURANT",
    "latitude": 35.1,
    "longitude": 129.0,
    "priceInfo": "김치찌개 6000원"
  }
]
```

예외 상황:

- 지도 범위 파라미터 누락
- 위도 또는 경도 형식 오류

권한 조건:

- 인증 없이 호출 가능합니다.

## Admin Place API

관리자 API는 추후 Spring Security와 JWT 적용 뒤 `ADMIN` 권한만 접근 가능하도록 변경합니다.

### 승인 대기 장소 목록 조회

```http
GET /api/admin/places/pending
```

`PENDING` 상태의 장소 목록을 조회합니다.

Response Body:

```json
[
  {
    "id": 1,
    "name": "학생식당",
    "category": "RESTAURANT",
    "address": "부산광역시 남구 ...",
    "status": "PENDING",
    "createdAt": "2026-04-29T16:00:00"
  }
]
```

### 장소 승인

```http
PATCH /api/admin/places/{placeId}/approve
```

장소 상태를 `APPROVED`로 변경합니다.

Response Body:

```json
{
  "id": 1,
  "status": "APPROVED"
}
```

예외 상황:

- 존재하지 않는 장소 ID

### 장소 반려

```http
PATCH /api/admin/places/{placeId}/reject
```

장소 상태를 `REJECTED`로 변경합니다.

Response Body:

```json
{
  "id": 1,
  "status": "REJECTED"
}
```

### 장소 숨김

```http
PATCH /api/admin/places/{placeId}/hide
```

장소 상태를 `HIDDEN`으로 변경합니다.

Response Body:

```json
{
  "id": 1,
  "status": "HIDDEN"
}
```

### 장소 복구

```http
PATCH /api/admin/places/{placeId}/restore
```

숨김 처리된 장소를 다시 `APPROVED` 상태로 변경합니다.

Response Body:

```json
{
  "id": 1,
  "status": "APPROVED"
}
```

## Review API

리뷰 API는 Place 1차 흐름 구현 후 추가합니다.

### 리뷰 작성

```http
POST /api/places/{placeId}/reviews
```

`APPROVED` 상태의 장소에만 리뷰를 작성할 수 있습니다.

Request Body:

```json
{
  "rating": 5,
  "content": "가격이 저렴하고 양이 많습니다.",
  "crowdedLevel": 3,
  "priceAccurate": true,
  "visitedDate": "2026-04-29"
}
```

예외 상황:

- 존재하지 않는 장소 ID
- 승인되지 않은 장소에 리뷰 작성
- 평점 범위 오류

## Report API

신고 API는 리뷰 또는 관리자 숨김 기능 이후 추가합니다.

### 장소 신고

```http
POST /api/places/{placeId}/reports
```

잘못된 장소 정보를 신고합니다.

Request Body:

```json
{
  "reason": "WRONG_PRICE",
  "content": "현재 김치찌개 가격은 7000원입니다."
}
```

Response Body:

```json
{
  "id": 1,
  "placeId": 1,
  "reason": "WRONG_PRICE",
  "content": "현재 김치찌개 가격은 7000원입니다.",
  "createdAt": "2026-04-29T16:30:00"
}
```

예외 상황:

- 존재하지 않는 장소 ID
- 지원하지 않는 신고 사유

## 우선 구현 순서

1. `POST /api/places`
2. `GET /api/admin/places/pending`
3. `PATCH /api/admin/places/{placeId}/approve`
4. `GET /api/places`
5. `GET /api/places/{placeId}`
6. `GET /api/places/map`
7. `PATCH /api/admin/places/{placeId}/reject`
8. `PATCH /api/admin/places/{placeId}/hide`
9. `PATCH /api/admin/places/{placeId}/restore`
10. `POST /api/places/{placeId}/reports`
11. `POST /api/places/{placeId}/reviews`
