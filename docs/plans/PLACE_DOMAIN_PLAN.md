# Place 도메인 1차 구현 계획

## 계획 범위

이 문서는 아껴맵 1차 MVP의 Place 도메인 구현 계획입니다.

목표 흐름은 다음과 같습니다.

```text
Place 등록
-> PENDING 상태로 저장
-> 관리자 승인/반려
-> APPROVED 장소만 목록 조회
-> APPROVED 장소만 지도 마커 조회 API에 포함
```

이번 계획에는 리뷰, 신고, 로그인/JWT, MCP 기능을 포함하지 않습니다. 해당 기능은 1차 Place 승인 흐름이 동작한 뒤 별도 계획에서 다룹니다.

## 구현 목표

1차 구현의 목표는 사용자 제보 장소가 바로 노출되지 않고 관리자 검토를 거쳐 승인된 장소만 사용자 화면과 지도에 노출되는 흐름을 완성하는 것입니다.

구현 후 만족해야 하는 조건은 다음과 같습니다.

- 사용자가 장소를 등록하면 `PENDING` 상태로 저장됩니다.
- 일반 장소 목록 API는 `APPROVED` 상태의 장소만 반환합니다.
- 지도 마커 API는 지도 범위 안의 `APPROVED` 상태 장소만 반환합니다.
- 관리자는 `PENDING` 장소 목록을 조회할 수 있습니다.
- 관리자는 장소를 `APPROVED` 또는 `REJECTED` 상태로 변경할 수 있습니다.
- `REJECTED` 장소는 일반 목록과 지도 마커 API에 포함되지 않습니다.
- Controller는 Service 호출만 담당하고, 핵심 비즈니스 로직은 Service와 Entity 메서드에 둡니다.
- Entity를 API 응답으로 직접 반환하지 않고 DTO를 사용합니다.

## 전제 조건

현재 저장소에는 아직 `backend/` 디렉터리가 없습니다. 구현 단계에서는 Spring Boot 3.x 기반 백엔드 프로젝트를 `backend/` 아래에 생성합니다.

권장 기술 스택은 다음과 같습니다.

- Java 17 또는 Java 21
- Spring Boot 3.x
- Spring Web
- Spring Data JPA
- Validation
- Lombok
- H2 Database for local quick testing
- PostgreSQL profile later
- Gradle

초기 로컬 확인은 H2로 빠르게 진행하고, PostgreSQL은 이후 별도 설정으로 확장하는 것이 적절합니다.

## 생성할 파일 경로

패키지 루트는 `com.akkyomap.backend`로 통일합니다.

```text
backend/
├─ build.gradle
├─ settings.gradle
└─ src/
   ├─ main/
   │  ├─ java/
   │  │  └─ com/
   │  │     └─ akkyomap/
   │  │        └─ backend/
   │  │           ├─ AkkyomapApplication.java
   │  │           ├─ global/
   │  │           │  └─ exception/
   │  │           │     ├─ BusinessException.java
   │  │           │     ├─ ErrorCode.java
   │  │           │     └─ GlobalExceptionHandler.java
   │  │           └─ place/
   │  │              ├─ controller/
   │  │              │  ├─ PlaceController.java
   │  │              │  └─ AdminPlaceController.java
   │  │              ├─ dto/
   │  │              │  ├─ PlaceCreateRequest.java
   │  │              │  ├─ PlaceResponse.java
   │  │              │  ├─ PlaceDetailResponse.java
   │  │              │  ├─ PlaceMapResponse.java
   │  │              │  └─ PlaceStatusResponse.java
   │  │              ├─ entity/
   │  │              │  └─ Place.java
   │  │              ├─ repository/
   │  │              │  └─ PlaceRepository.java
   │  │              ├─ service/
   │  │              │  └─ PlaceService.java
   │  │              └─ type/
   │  │                 ├─ PlaceCategory.java
   │  │                 └─ PlaceStatus.java
   │  └─ resources/
   │     ├─ application.yml
   │     └─ application-local.yml
   └─ test/
      └─ java/
         └─ com/
            └─ akkyomap/
               └─ backend/
                  └─ place/
                     ├─ entity/
                     │  └─ PlaceTest.java
                     └─ service/
                        └─ PlaceServiceTest.java
```

`GlobalExceptionHandler`는 1차 구현에서 도입하는 편이 좋습니다. 장소 조회, 승인, 반려 단계에서 존재하지 않는 장소 예외가 바로 필요하기 때문입니다. 단, 응답 포맷은 과도하게 복잡하게 만들지 않고 최소 구조로 시작합니다.

## 패키지 구조

```text
com.akkyomap.backend
├─ global
│  └─ exception
└─ place
   ├─ controller
   ├─ dto
   ├─ entity
   ├─ repository
   ├─ service
   └─ type
```

패키지 역할은 다음과 같습니다.

- `place.entity`: JPA Entity와 도메인 상태 변경 메서드
- `place.type`: Place 관련 enum
- `place.dto`: 요청/응답 DTO
- `place.repository`: Spring Data JPA Repository
- `place.service`: 등록, 조회, 승인, 반려 비즈니스 로직
- `place.controller`: 일반 사용자 API와 관리자 API
- `global.exception`: 공통 예외와 예외 응답 처리

관리자 기능은 반드시 `AdminPlaceController`로 분리합니다. URL도 `/api/admin/...`로 분리하여 일반 사용자 API와 섞지 않습니다.

## Entity 설계

### Place

`Place`는 사용자 제보 장소이자 승인 상태 관리의 중심 도메인입니다.

필드 설계:

| 필드 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | Long | PK | 장소 ID |
| name | String | not null, length 제한 | 장소 이름 |
| category | PlaceCategory | not null, enum string | 장소 카테고리 |
| address | String | not null | 주소 |
| latitude | Double | not null | 위도 |
| longitude | Double | not null | 경도 |
| priceInfo | String | nullable 또는 length 제한 | 가격 정보 |
| description | String | nullable 또는 length 제한 | 설명 |
| status | PlaceStatus | not null, enum string | 장소 상태 |
| createdAt | LocalDateTime | not null | 생성일시 |
| updatedAt | LocalDateTime | not null | 수정일시 |

상태 변경 메서드:

```java
public void approve()
public void reject()
```

이번 1차 계획에는 숨김/복구가 포함되지 않으므로 `hide()`, `restore()`는 구현하지 않습니다. 2차 MVP에서 신고/숨김 기능을 구현할 때 추가합니다.

생성 규칙:

- `PlaceCreateRequest`로부터 Place를 생성합니다.
- 생성 시 status는 외부 입력을 받지 않고 반드시 `PENDING`으로 설정합니다.
- `createdAt`, `updatedAt`은 JPA Auditing 또는 Entity lifecycle callback으로 관리합니다.

상태 전이 정책:

```text
PENDING -> APPROVED
PENDING -> REJECTED
```

초기 구현에서는 승인/반려 대상이 `PENDING`이 아니어도 상태를 덮어쓸지, 예외를 낼지 결정해야 합니다. 이 계획에서는 운영 흐름을 명확히 하기 위해 `PENDING` 상태에서만 승인/반려를 허용하는 방식을 권장합니다.

## Enum 설계

### PlaceStatus

```java
public enum PlaceStatus {
    PENDING,
    APPROVED,
    REJECTED,
    HIDDEN
}
```

`HIDDEN`은 2차 MVP에서 사용하지만, 상태값 정의 자체는 AGENTS.md 기준에 맞춰 처음부터 포함합니다. 단, 이번 구현에서는 `hide()`, `restore()`, 숨김/복구 API, HIDDEN 관련 테스트를 만들지 않습니다.

### PlaceCategory

```java
public enum PlaceCategory {
    RESTAURANT,
    CAFE,
    STUDY_SPACE,
    PRINT_COPY,
    CONVENIENCE
}
```

초기에는 enum 내부에 한글 표시명을 넣지 않아도 됩니다. 프론트엔드에서 표시명을 처리하거나 이후 필요할 때 enum 필드를 추가합니다.

## DTO 설계

### PlaceCreateRequest

장소 등록 요청 DTO입니다.

필드:

| 필드 | 타입 | 검증 |
| --- | --- | --- |
| name | String | `@NotBlank` |
| category | PlaceCategory | `@NotNull` |
| address | String | `@NotBlank` |
| latitude | Double | `@NotNull`, `@DecimalMin("-90.0")`, `@DecimalMax("90.0")` |
| longitude | Double | `@NotNull`, `@DecimalMin("-180.0")`, `@DecimalMax("180.0")` |
| priceInfo | String | 선택 |
| description | String | 선택 |

`status`는 요청으로 받지 않습니다.

### PlaceResponse

목록 조회 응답 DTO입니다.

필드:

- `id`
- `name`
- `category`
- `address`
- `priceInfo`
- `status`

일반 목록 조회는 `APPROVED`만 반환하지만, 응답에 status를 포함하면 디버깅과 관리자 화면 재사용에 도움이 됩니다.

### PlaceDetailResponse

상세 조회 응답 DTO입니다.

필드:

- `id`
- `name`
- `category`
- `address`
- `latitude`
- `longitude`
- `priceInfo`
- `description`
- `status`
- `createdAt`
- `updatedAt`

상세 조회에서 승인되지 않은 장소를 공개할지 여부는 정책 결정이 필요합니다. 1차 MVP에서는 일반 사용자 상세 조회도 `APPROVED` 장소만 허용하는 방식을 권장합니다. 관리자용 상세 조회가 필요하면 이후 별도 API로 분리합니다.

### PlaceMapResponse

지도 마커 조회 응답 DTO입니다.

필드:

- `id`
- `name`
- `category`
- `latitude`
- `longitude`
- `priceInfo`

지도 마커 API는 화면 표시와 클릭 진입에 필요한 최소 정보만 반환합니다.

### PlaceStatusResponse

관리자 승인/반려 응답 DTO입니다.

필드:

- `id`
- `status`

관리자 상태 변경 API는 변경 결과를 간결하게 반환합니다.

## Repository 설계

### PlaceRepository

Spring Data JPA Repository를 사용합니다.

```java
public interface PlaceRepository extends JpaRepository<Place, Long> {
    List<Place> findAllByStatus(PlaceStatus status);

    List<Place> findAllByStatusAndLatitudeBetweenAndLongitudeBetween(
        PlaceStatus status,
        Double swLat,
        Double neLat,
        Double swLng,
        Double neLng
    );
}
```

용도:

- `findAllByStatus(PENDING)`: 관리자 승인 대기 목록 조회
- `findAllByStatus(APPROVED)`: 일반 장소 목록 조회
- `findAllByStatusAndLatitudeBetweenAndLongitudeBetween(...)`: 지도 범위 내 승인 장소 조회

주의할 점:

- 초기 MVP에서는 QueryDSL을 도입하지 않습니다.
- 정렬, 검색어, 카테고리 필터는 이번 범위에서 제외합니다.
- 지도 범위 조회는 `status = APPROVED` 조건을 반드시 포함합니다.

## Service 설계

### PlaceService

Place 관련 비즈니스 로직을 담당합니다.

메서드 설계:

```java
public PlaceDetailResponse createPlace(PlaceCreateRequest request)

@Transactional(readOnly = true)
public List<PlaceResponse> getApprovedPlaces()

@Transactional(readOnly = true)
public PlaceDetailResponse getApprovedPlace(Long placeId)

@Transactional(readOnly = true)
public List<PlaceMapResponse> getApprovedPlacesInBounds(
    Double swLat,
    Double swLng,
    Double neLat,
    Double neLng
)

@Transactional(readOnly = true)
public List<PlaceResponse> getPendingPlaces()

public PlaceStatusResponse approvePlace(Long placeId)

public PlaceStatusResponse rejectPlace(Long placeId)
```

비즈니스 규칙:

- `createPlace`: 요청 값으로 Place를 생성하고 `PENDING` 상태로 저장합니다.
- `getApprovedPlaces`: `APPROVED` 상태만 조회합니다.
- `getApprovedPlace`: 존재하지 않거나 `APPROVED`가 아닌 장소는 예외 처리합니다.
- `getApprovedPlacesInBounds`: 지도 범위 안의 `APPROVED` 상태만 조회합니다.
- `getPendingPlaces`: 관리자 승인 대기 목록으로 `PENDING` 상태만 조회합니다.
- `approvePlace`: 장소를 조회하고 `PENDING -> APPROVED`로 변경합니다.
- `rejectPlace`: 장소를 조회하고 `PENDING -> REJECTED`로 변경합니다.

트랜잭션:

- 저장과 상태 변경 메서드에는 `@Transactional`을 적용합니다.
- 조회 메서드에는 `@Transactional(readOnly = true)`를 적용합니다.

## Controller 설계

### PlaceController

일반 사용자용 Place API입니다.

Base URL:

```text
/api/places
```

API:

| Method | URL | 설명 |
| --- | --- | --- |
| POST | `/api/places` | 장소 등록 |
| GET | `/api/places` | 승인된 장소 목록 조회 |
| GET | `/api/places/{placeId}` | 승인된 장소 상세 조회 |
| GET | `/api/places/map` | 지도 범위 내 승인된 장소 조회 |

지도 API Query Parameter:

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| swLat | Double | 남서쪽 위도 |
| swLng | Double | 남서쪽 경도 |
| neLat | Double | 북동쪽 위도 |
| neLng | Double | 북동쪽 경도 |

검증 규칙:

- `swLat`, `swLng`, `neLat`, `neLng`는 모두 필수입니다.
- 위도는 -90 이상 90 이하입니다.
- 경도는 -180 이상 180 이하입니다.
- `swLat <= neLat`이어야 합니다.
- `swLng <= neLng`이어야 합니다.

Controller 역할:

- 요청 DTO 검증
- Query Parameter 수신
- Service 호출
- 응답 DTO 반환

Controller에는 승인 여부 판단, 상태 변경, 지도 조회 조건 조립 같은 비즈니스 로직을 두지 않습니다.

### AdminPlaceController

관리자용 Place API입니다.

Base URL:

```text
/api/admin/places
```

API:

| Method | URL | 설명 |
| --- | --- | --- |
| GET | `/api/admin/places/pending` | 승인 대기 장소 목록 조회 |
| PATCH | `/api/admin/places/{placeId}/approve` | 장소 승인 |
| PATCH | `/api/admin/places/{placeId}/reject` | 장소 반려 |

주의:

- 초기에는 인증 없이 동작할 수 있습니다.
- 구현 시 `TODO: Spring Security 적용 후 ADMIN 권한 필요` 주석을 남깁니다.
- 일반 사용자 API와 관리자 API를 같은 Controller에 섞지 않습니다.

## 예외 처리 방식

1차 구현에서는 최소한의 공통 예외 처리를 도입합니다.

이번 단계에서 만드는 공통 예외 구성은 다음 세 파일로 제한합니다.

- `BusinessException`
- `ErrorCode`
- `GlobalExceptionHandler`

`ApiResponse` 같은 성공 응답 래퍼는 이번 단계에서 만들지 않습니다. 성공 응답은 각 API의 DTO를 직접 반환하고, 실패 응답만 `GlobalExceptionHandler`에서 일관된 형식으로 처리합니다.

### ErrorCode

예상 에러 코드는 다음 정도로 시작합니다.

| 코드 | HTTP Status | 메시지 |
| --- | --- | --- |
| PLACE_NOT_FOUND | 404 | 장소를 찾을 수 없습니다. |
| PLACE_NOT_APPROVED | 404 또는 403 | 승인된 장소가 아닙니다. |
| INVALID_PLACE_STATUS | 400 | 현재 상태에서는 처리할 수 없습니다. |
| INVALID_MAP_BOUNDS | 400 | 지도 범위 값이 올바르지 않습니다. |

`PLACE_NOT_APPROVED`는 일반 사용자에게 미승인 장소 존재 여부를 노출하지 않으려면 404로 처리하는 것이 적절합니다.

### BusinessException

도메인 규칙 위반이나 리소스 조회 실패를 표현합니다.

예:

- 존재하지 않는 장소 조회
- 승인되지 않은 장소 상세 조회
- `PENDING`이 아닌 장소 승인/반려
- 지도 범위 파라미터 오류: `swLat > neLat`, `swLng > neLng`

### GlobalExceptionHandler

`BusinessException`과 Validation 예외를 공통 형식으로 변환합니다.

권장 실패 응답:

```json
{
  "success": false,
  "message": "장소를 찾을 수 없습니다.",
  "data": null
}
```

성공 응답 정책:

- `POST /api/places`: `PlaceDetailResponse` 직접 반환
- `GET /api/places`: `List<PlaceResponse>` 직접 반환
- `GET /api/places/{placeId}`: `PlaceDetailResponse` 직접 반환
- `GET /api/places/map`: `List<PlaceMapResponse>` 직접 반환
- `GET /api/admin/places/pending`: `List<PlaceResponse>` 직접 반환
- `PATCH /api/admin/places/{placeId}/approve`: `PlaceStatusResponse` 직접 반환
- `PATCH /api/admin/places/{placeId}/reject`: `PlaceStatusResponse` 직접 반환

## 테스트 계획

테스트는 1차 Place 흐름의 도메인 규칙을 우선 검증합니다.

### Entity 테스트

`PlaceTest`

- Place 생성 시 기본 상태가 `PENDING`인지 확인
- `approve()` 호출 시 상태가 `APPROVED`로 변경되는지 확인
- `reject()` 호출 시 상태가 `REJECTED`로 변경되는지 확인
- `PENDING`이 아닌 상태에서 승인/반려할 때 예외를 낼 경우 해당 정책 검증
- `HIDDEN` 관련 상태 변경 테스트는 2차 MVP로 미룹니다.

### Service 테스트

`PlaceServiceTest`

- 장소 등록 시 `PENDING` 상태로 저장되는지 확인
- 승인된 장소만 목록 조회에 포함되는지 확인
- `PENDING`, `REJECTED` 장소는 일반 목록에 포함되지 않는지 확인
- 관리자가 장소 승인 시 상태가 `APPROVED`로 변경되는지 확인
- 관리자가 장소 반려 시 상태가 `REJECTED`로 변경되는지 확인
- 지도 범위 조회에서 `APPROVED` 상태와 좌표 범위를 모두 만족하는 장소만 반환되는지 확인
- 지도 범위 조회에서 `PENDING`, `REJECTED` 장소가 포함되지 않는지 확인
- 지도 범위 조회에서 `swLat > neLat` 또는 `swLng > neLng`이면 예외가 발생하는지 확인
- 존재하지 않는 장소 승인/반려 시 예외가 발생하는지 확인
- 승인되지 않은 장소 상세 조회 시 예외가 발생하는지 확인
- `HIDDEN` 장소 제외 테스트는 2차 MVP로 미룹니다.

### Controller 테스트

Controller 테스트는 Service 테스트 이후 추가합니다.

- `POST /api/places` 요청 검증
- `GET /api/places`가 승인된 장소 응답을 반환하는지 확인
- `GET /api/places/map`이 지도 파라미터를 정상 수신하는지 확인
- `GET /api/places/map`에서 잘못된 지도 범위 파라미터가 들어오면 400 응답 확인
- `PATCH /api/admin/places/{placeId}/approve`가 Service를 호출하는지 확인
- `PATCH /api/admin/places/{placeId}/reject`가 Service를 호출하는지 확인
- Validation 실패 시 400 응답 확인

### Repository 테스트

초기에는 Service 테스트에서 Repository를 mocking하는 방식으로 시작할 수 있습니다. 지도 범위 조회 쿼리는 조건 실수가 나기 쉬우므로, 여유가 있으면 `@DataJpaTest`로 다음을 검증합니다.

- `findAllByStatus(APPROVED)`가 승인된 장소만 반환하는지 확인
- `findAllByStatusAndLatitudeBetweenAndLongitudeBetween(...)`가 상태와 좌표 범위를 모두 적용하는지 확인

## 구현 순서 체크리스트

아래 순서대로 작게 구현합니다.

- [x] `backend/` Spring Boot 프로젝트 생성
- [x] 기본 의존성 설정
- [x] H2 기반 로컬 설정 추가
- [x] `PlaceStatus` enum 생성
- [x] `PlaceCategory` enum 생성
- [x] `Place` Entity 생성
- [x] Place 상태 변경 메서드 `approve()`, `reject()` 추가
- [x] `PlaceCreateRequest` 생성
- [x] `PlaceResponse` 생성
- [x] `PlaceDetailResponse` 생성
- [x] `PlaceMapResponse` 생성
- [x] `PlaceStatusResponse` 생성
- [x] `PlaceRepository` 생성
- [x] `BusinessException`, `ErrorCode`, `GlobalExceptionHandler` 생성
- [x] 실패 응답 형식 정의
- [x] `PlaceService.createPlace()` 구현
- [x] `PlaceService.getApprovedPlaces()` 구현
- [x] `PlaceService.getApprovedPlace()` 구현
- [x] `PlaceService.getApprovedPlacesInBounds()` 구현
- [x] `PlaceService.getPendingPlaces()` 구현
- [x] `PlaceService.approvePlace()` 구현
- [x] `PlaceService.rejectPlace()` 구현
- [x] `PlaceController` 생성
- [x] `AdminPlaceController` 생성
- [x] 지도 범위 검증 구현
- [x] Entity 테스트 작성
- [x] Service 테스트 작성
- [ ] 필요 시 Controller 테스트 작성
- [ ] 필요 시 Repository 테스트 작성
- [x] 로컬에서 테스트 실행
- [ ] API 수동 확인
- [ ] README 또는 API 문서 갱신 필요 여부 확인

## 이번 계획에서 제외하는 것

다음은 이번 1차 구현 계획에 포함하지 않습니다.

- 리뷰 작성
- 신고 저장
- 관리자 숨김/복구
- `hide()`, `restore()` 상태 변경 메서드
- HIDDEN 관련 테스트
- 로그인/JWT
- `USER` / `ADMIN` 권한 분리
- MCP 기반 AI 장소 검색 도구
- QueryDSL
- Docker
- CI/CD
- 즐겨찾기
- 내가 등록한 장소 조회
- 가격 변경 제보
- 거리순 정렬
- 추천순 정렬
