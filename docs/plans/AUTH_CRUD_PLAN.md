# Auth + Place CRUD 2차 구현 계획

## 계획 범위

이 문서는 아껴맵 2차 구현 계획입니다.

목표는 회원가입/로그인, JWT 인증, `USER`/`ADMIN` 권한 분리, 로그인 사용자 기반 Place 등록 및 내가 등록한 장소 CRUD를 추가하는 것입니다.

이번 문서는 계획만 작성합니다. 아직 코드는 구현하지 않습니다.

## 구현 목표

- 회원가입 기능을 추가합니다.
- 로그인 기능을 추가합니다.
- JWT 기반 인증을 추가합니다.
- `USER` / `ADMIN` 권한을 분리합니다.
- Place 등록 시 로그인 사용자와 Place를 연결합니다.
- 내가 등록한 장소 조회 기능을 추가합니다.
- 내가 등록한 장소 수정 기능을 추가합니다.
- 내가 등록한 장소 삭제 기능을 추가합니다.
- 관리자 승인/반려 API는 `ADMIN`만 접근 가능하게 변경합니다.
- 기존 승인된 장소 목록/지도/상세 조회 API는 비회원도 접근 가능하게 유지합니다.

## 권한 정책

### 비회원

비회원은 공개 조회와 인증 관련 API만 사용할 수 있습니다.

- 승인된 장소 목록 조회 가능
- 승인된 장소 상세 조회 가능
- 지도 마커 조회 가능
- 회원가입 가능
- 로그인 가능

### USER

`USER`는 일반 사용자입니다.

- 장소 등록 가능
- 내가 등록한 장소 조회 가능
- 내가 등록한 장소 수정 가능
- 내가 등록한 장소 삭제 가능
- 승인된 장소 목록/상세/지도 조회 가능
- 관리자 승인/반려 API 접근 불가

### ADMIN

`ADMIN`은 운영 관리자입니다.

- 승인 대기 장소 조회 가능
- 장소 승인 가능
- 장소 반려 가능
- 필요 시 모든 장소 조회 가능
- 일반 사용자보다 넓은 관리 권한 보유

2차 구현에서는 회원가입 시 항상 기본 `USER` 권한만 생성합니다.

`ADMIN` 전용 회원가입 API는 만들지 않습니다. 로컬 개발 단계에서는 회원가입으로 생성한 계정의 role을 DB에서 직접 `ADMIN`으로 변경해 관리자 계정으로 사용합니다.

## 비회원/USER/ADMIN별 접근 가능 API

| API | 비회원 | USER | ADMIN |
| --- | --- | --- | --- |
| `POST /api/auth/signup` | 가능 | 가능 | 가능 |
| `POST /api/auth/login` | 가능 | 가능 | 가능 |
| `GET /api/places` | 가능 | 가능 | 가능 |
| `GET /api/places/{placeId}` | 가능 | 가능 | 가능 |
| `GET /api/places/map` | 가능 | 가능 | 가능 |
| `POST /api/places` | 불가 | 가능 | 가능 |
| `GET /api/places/me` | 불가 | 가능 | 가능 |
| `PATCH /api/places/{placeId}` | 불가 | 본인 등록 장소만 가능 | 정책 선택 |
| `DELETE /api/places/{placeId}` | 불가 | 본인 등록 장소만 가능 | 정책 선택 |
| `GET /api/admin/places/pending` | 불가 | 불가 | 가능 |
| `PATCH /api/admin/places/{placeId}/approve` | 불가 | 불가 | 가능 |
| `PATCH /api/admin/places/{placeId}/reject` | 불가 | 불가 | 가능 |
| `GET /api/admin/places` | 불가 | 불가 | 선택 구현 |

기존 공개 조회 API는 현재 프론트 지도 기능이 의존하고 있으므로 가능한 응답 구조를 유지합니다.

공개 장소 목록/상세/지도 API는 기존처럼 `APPROVED` 상태만 조회합니다. 내 장소 목록에서는 `DELETED` 상태를 제외합니다.

## 추가할 Entity/Enum

### User

패키지 후보:

```text
com.akkyomap.backend.user
```

필드 후보:

```java
@Table(name = "users")
private Long id;
private String email;
private String password;
private String nickname;
private UserRole role;
private LocalDateTime createdAt;
private LocalDateTime updatedAt;
```

설계 원칙:

- `email`은 로그인 ID로 사용하며 unique 제약을 둡니다.
- `password`는 BCrypt로 해싱해서 저장합니다.
- 회원가입 요청의 password 원문은 저장하지 않습니다.
- 초기 role은 기본 `USER`입니다.
- 테이블명은 MySQL 예약어 충돌을 피하기 위해 `users`로 지정합니다.

### UserRole

```java
public enum UserRole {
    USER,
    ADMIN
}
```

Spring Security 권한 매핑 시 `ROLE_USER`, `ROLE_ADMIN` 형태로 변환합니다.

## 수정할 기존 Entity/Enum

### Place와 User 연관관계

Place에 등록자 연관관계를 추가합니다.

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "created_by_user_id", nullable = true)
private User createdBy;
```

초기에는 Place 등록자만 추적합니다. 수정자/승인자 추적은 필요하면 후속 단계에서 추가합니다.

기존 MySQL 데이터 호환을 위해 `created_by_user_id`는 nullable로 시작합니다. 2차 구현 이후 신규 장소 등록부터 로그인 사용자를 `createdBy`로 연결합니다.

`createdBy`가 `null`인 기존 장소는 일반 `USER`가 수정/삭제할 수 없습니다. 해당 데이터는 기존 이관 데이터로 보고 `ADMIN` 관리 대상으로만 다룹니다.

Place 생성 방식은 다음처럼 확장합니다.

```java
Place.create(..., User createdBy)
```

기존 공개 조회 응답 DTO에는 등록자 정보를 바로 노출하지 않는 방향을 우선 검토합니다. 기존 프론트 지도 기능을 깨지 않기 위해 `PlaceMapResponse`, `PlaceResponse`, `PlaceDetailResponse` 구조는 가능하면 유지합니다.

### PlaceStatus 변경 필요 여부

현재 상태값:

```java
PENDING,
APPROVED,
REJECTED,
HIDDEN
```

삭제 정책은 `DELETED` 상태를 추가하는 소프트 삭제로 확정합니다.

```java
DELETED
```

확정 정책:

- 2차 구현에서 `DELETED`를 추가합니다.
- USER가 본인 장소를 삭제하면 물리 삭제하지 않고 `DELETED` 상태로 변경합니다.
- 공개 장소 목록/상세/지도 API는 기존처럼 `APPROVED` 상태만 조회하므로 `DELETED`는 노출되지 않습니다.
- 내 장소 목록에서도 `DELETED` 상태는 제외합니다.
- 삭제된 장소 복구 기능은 이번 단계에서 구현하지 않습니다.

## JWT 인증 구조

구성 후보:

```text
global/security/
├─ JwtTokenProvider.java
├─ JwtAuthenticationFilter.java
├─ SecurityConfig.java
├─ CustomUserDetails.java
├─ CustomUserDetailsService.java
└─ SecurityExceptionHandler.java
```

JWT 정책:

- 로그인 성공 시 access token을 발급합니다.
- refresh token은 이번 단계에서 제외합니다.
- token에는 user id, email, role을 포함합니다.
- 클라이언트는 `Authorization: Bearer {token}` 헤더로 요청합니다.
- secret은 코드에 하드코딩하지 않고 환경변수로 관리합니다.

환경변수 후보:

```text
JWT_SECRET
JWT_ACCESS_TOKEN_EXPIRATION
```

`application-local.yml`에는 개발 기본값을 둘 수 있지만, 실제 운영 secret은 Git에 커밋하지 않는 것이 원칙입니다.

## Spring Security 설정 방향

의존성 후보:

```gradle
implementation 'org.springframework.boot:spring-boot-starter-security'
implementation 'io.jsonwebtoken:jjwt-api'
runtimeOnly 'io.jsonwebtoken:jjwt-impl'
runtimeOnly 'io.jsonwebtoken:jjwt-jackson'
```

Security 설정 방향:

- CSRF는 JWT stateless API 구조에 맞춰 비활성화합니다.
- session은 stateless로 설정합니다.
- CORS는 아직 프론트가 Vite proxy를 사용하므로 최소화합니다. 추후 배포 단계에서 별도 정책을 둡니다.
- 공개 API는 `permitAll`로 유지합니다.
- 장소 등록/내 장소 API는 인증 필요.
- 관리자 API는 `hasRole("ADMIN")`.
- Actuator는 local 개발 편의를 위해 현재 노출 정책을 유지하되, 운영 배포 전 보안 검토가 필요합니다.

권한 설정 예시 방향:

```text
permitAll:
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/places
- GET /api/places/{placeId}
- GET /api/places/map
- /swagger-ui/**
- /v3/api-docs/**
- /actuator/health

authenticated:
- POST /api/places
- GET /api/places/me
- PATCH /api/places/{placeId}
- DELETE /api/places/{placeId}

ADMIN:
- /api/admin/**
```

## API 목록

### Auth API

```text
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me
```

`GET /api/auth/me`는 로그인 상태 확인과 프론트 연동 편의를 위해 검토합니다.

### Public Place API

기존 응답 구조 유지. 조회 대상은 기존처럼 `APPROVED` 상태만 포함합니다.

```text
GET /api/places
GET /api/places/{placeId}
GET /api/places/map
```

### Authenticated Place API

```text
POST /api/places
GET /api/places/me
PATCH /api/places/{placeId}
DELETE /api/places/{placeId}
```

기존 `POST /api/places`는 비회원 접근에서 인증 필요 API로 바뀝니다. 프론트 1차 등록 폼은 2차 프론트 작업에서 JWT 헤더를 붙이도록 수정이 필요합니다.

2차 구현은 우선 backend 중심으로 진행합니다. frontend 로그인 화면, 토큰 저장, 인증 헤더 적용, 내 장소 화면은 별도 계획에서 다룹니다.

### Admin Place API

```text
GET /api/admin/places/pending
PATCH /api/admin/places/{placeId}/approve
PATCH /api/admin/places/{placeId}/reject
GET /api/admin/places
```

`GET /api/admin/places`는 필요 시 모든 상태 장소 조회용으로 추가합니다. 2차 필수 여부는 구현 전 확정합니다.

## Request/Response DTO 설계

### Auth DTO

```text
SignupRequest
- email
- password
- nickname

LoginRequest
- email
- password

TokenResponse
- accessToken
- tokenType
- expiresIn

UserResponse
- id
- email
- nickname
- role
```

### Place DTO

기존 DTO 유지:

```text
PlaceCreateRequest
PlaceResponse
PlaceDetailResponse
PlaceMapResponse
PlaceStatusResponse
```

추가 후보:

```text
PlaceUpdateRequest
MyPlaceResponse
```

`PlaceUpdateRequest` 필드:

- name
- category
- address
- latitude
- longitude
- priceInfo
- description

`MyPlaceResponse`는 내가 등록한 장소 목록에서 상태와 등록일을 보여주기 위해 사용할 수 있습니다. 기존 `PlaceResponse` 재사용도 가능하지만, 내 장소 화면에서 필요한 필드가 다르면 별도 DTO가 더 명확합니다.

## 장소 수정 정책

권장 정책:

- `USER`는 본인이 등록한 장소만 수정할 수 있습니다.
- 수정 대상이 `PENDING`, `REJECTED`이면 수정 후 `PENDING` 상태로 둡니다.
- 수정 대상이 `APPROVED`이면 수정 후 다시 `PENDING` 상태로 변경합니다.

이유:

- 승인된 장소가 사용자 수정 후 검수 없이 계속 노출되면 정보 신뢰도가 깨집니다.
- 아껴맵의 핵심은 사용자 제보 데이터의 신뢰도 관리이므로, 수정 후 재승인 흐름이 도메인 방향과 맞습니다.

Entity 메서드 후보:

```java
place.updateByOwner(...)
place.resetToPendingForReview()
```

주의:

- `APPROVED` 장소가 수정되어 `PENDING`이 되면 공개 목록/지도에서 사라집니다.
- 프론트에서는 수정 완료 후 “관리자 재승인 후 지도에 다시 표시됩니다” 안내가 필요합니다.

ADMIN 수정 정책:

- 2차 필수 범위에서는 ADMIN 직접 수정 기능을 만들지 않는 것을 권장합니다.
- 필요하면 후속 관리자 화면에서 별도 `AdminPlaceUpdateRequest`와 관리자 수정 API를 설계합니다.

## 장소 삭제 정책

### 물리 삭제

장점:

- 구현이 단순합니다.
- DB에 불필요한 데이터가 남지 않습니다.

단점:

- 운영 이력과 사용자 제보 기록이 사라집니다.
- 향후 신고, 복구, 감사 로그와 연결하기 어렵습니다.

### 소프트 삭제

방식:

- `PlaceStatus.DELETED` 추가
- USER가 본인 장소를 삭제하면 status를 `DELETED`로 변경
- 공개 목록/지도/상세에서는 `DELETED` 제외

장점:

- 운영 이력 보존에 유리합니다.
- 포트폴리오에서 상태 기반 운영 흐름을 더 잘 보여줄 수 있습니다.
- 향후 복구/감사/신고 흐름과 연결하기 쉽습니다.

단점:

- 모든 조회 조건에서 `DELETED` 제외를 신경 써야 합니다.
- 상태 전이가 조금 복잡해집니다.

권장안:

- 2차에서는 `DELETED` 상태를 추가하는 소프트 삭제로 구현합니다.
- 물리 삭제는 운영 이력 보존과 향후 신고/복구 흐름을 고려해 사용하지 않습니다.
- 삭제된 장소 복구 기능은 이번 단계에서 구현하지 않습니다.

## Swagger에서 JWT 인증 테스트 가능하게 하는 방식

`OpenApiConfig`에 Bearer JWT security scheme을 추가합니다.

방향:

```text
SecurityScheme type: HTTP
scheme: bearer
bearerFormat: JWT
```

Swagger UI에서 Authorize 버튼으로 access token을 입력한 뒤 인증 API를 테스트할 수 있게 합니다.

주의:

- Swagger 설정만 수정하고, API 응답 구조를 바꾸지 않습니다.
- 공개 API는 토큰 없이도 테스트 가능해야 합니다.

## 테스트 계획

우선순위:

1. AuthService 단위 테스트
2. PlaceService 권한 검증 테스트
3. Security/JWT 필터 테스트
4. Controller 테스트
5. Repository 테스트

중요 테스트:

- 회원가입 시 비밀번호가 해싱되어 저장되는지
- 중복 email 가입이 거부되는지
- 로그인 성공 시 JWT가 발급되는지
- 로그인 실패 시 예외가 발생하는지
- 비회원이 공개 Place 조회 API에 접근 가능한지
- 비회원이 `POST /api/places`에 접근할 수 없는지
- USER가 장소 등록 시 createdBy와 연결되는지
- `createdBy`가 null인 기존 장소는 USER가 수정/삭제할 수 없는지
- USER가 본인 장소 목록만 조회하는지
- 내 장소 목록에서 `DELETED` 상태가 제외되는지
- USER가 남의 장소를 수정/삭제할 수 없는지
- USER가 `APPROVED` 장소를 수정하면 `PENDING`으로 변경되는지
- USER가 본인 장소를 삭제하면 `DELETED` 상태로 변경되는지
- 공개 목록/상세/지도 API가 `APPROVED` 상태만 반환하고 `DELETED`를 노출하지 않는지
- ADMIN만 승인 대기 목록/승인/반려 API에 접근 가능한지
- test profile은 H2로 유지되고 MySQL 없이 `./gradlew test`가 성공하는지

## 구현 순서 체크리스트

아래 순서는 사용자가 구현을 승인한 뒤 진행합니다.

- [ ] Spring Security와 JWT 의존성을 추가합니다.
- [ ] JWT 환경변수 설정 방향을 `application-local.yml`에 추가합니다.
- [ ] User Entity와 UserRole enum을 추가합니다.
- [ ] UserRepository를 추가합니다.
- [ ] Auth DTO를 추가합니다.
- [ ] AuthService를 추가합니다.
- [ ] AuthController를 추가합니다.
- [ ] 회원가입은 항상 기본 `USER` 권한으로 생성되도록 구현합니다.
- [ ] PasswordEncoder Bean을 설정합니다.
- [ ] CustomUserDetailsService를 구현합니다.
- [ ] JwtTokenProvider를 구현합니다.
- [ ] JwtAuthenticationFilter를 구현합니다.
- [ ] SecurityConfig에서 공개/인증/관리자 API 권한을 설정합니다.
- [ ] Place에 User 연관관계를 추가합니다.
- [ ] `created_by_user_id`는 기존 데이터 호환을 위해 nullable로 시작합니다.
- [ ] Place 등록 시 현재 로그인 사용자를 연결합니다.
- [ ] `createdBy`가 null인 기존 장소는 USER 수정/삭제 대상에서 제외합니다.
- [ ] 내가 등록한 장소 조회 API를 추가합니다.
- [ ] 내 장소 목록에서 `DELETED` 상태를 제외합니다.
- [ ] PlaceUpdateRequest와 수정 로직을 추가합니다.
- [ ] 장소 수정 시 본인 소유 검증을 추가합니다.
- [ ] APPROVED 장소 수정 시 PENDING 재검수 정책을 적용합니다.
- [ ] `PlaceStatus.DELETED`를 추가합니다.
- [ ] 삭제 API는 물리 삭제가 아니라 `DELETED` 상태 변경으로 구현합니다.
- [ ] 관리자 API를 ADMIN 전용으로 변경합니다.
- [ ] Swagger JWT 인증 설정을 추가합니다.
- [ ] Auth/Place/Security 테스트를 추가합니다.
- [ ] `./gradlew test`와 JaCoCo 리포트 생성을 확인합니다.
- [ ] README 또는 docs에 인증 API와 JWT 테스트 방법을 정리합니다.

## 이번 단계에서 제외할 기능

- 리뷰
- 신고
- 즐겨찾기
- 가격 변경 제보
- 거리순 정렬
- 추천순 정렬
- MCP 기반 AI 장소 검색 도구
- QueryDSL
- 배포
- CI/CD
- refresh token
- OAuth 로그인
- 비밀번호 재설정
- 이메일 인증
- 관리자 프론트엔드 전체 구현
- `ADMIN` 전용 회원가입 API
- 삭제된 장소 복구 기능

이번 구현은 우선 backend 중심으로 진행합니다. 실제 프론트 작업은 로그인 화면, 토큰 저장, 인증 헤더 적용, 내 장소 화면, 관리자 화면을 별도 계획으로 나눕니다.

## 기존 설정 유지 조건

- MySQL local 설정은 유지합니다.
- test profile H2 설정은 유지합니다.
- Actuator, Prometheus, Grafana 설정은 유지합니다.
- `dev-start.sh`, `dev-stop.sh` 구조는 유지합니다.
- 기존 공개 Place 조회 API와 지도 API 응답 구조는 가능하면 유지합니다.
- 기존 프론트 지도 기능이 깨지지 않도록 공개 조회 API는 비회원 접근 가능하게 유지합니다.

## 예상 위험 요소

- Spring Security 도입 후 기존 공개 API가 의도치 않게 401/403을 반환할 수 있습니다.
- 기존 프론트 장소 등록 폼은 JWT 없이 `POST /api/places`를 호출하므로 2차 backend 적용 후 프론트 수정이 필요합니다.
- User와 Place 연관관계 추가 시 기존 MySQL 데이터의 `created_by_user_id` 처리 전략이 필요합니다.
- `APPROVED` 장소 수정 후 `PENDING` 전환은 지도에서 장소가 사라지는 UX를 만들 수 있습니다.
- `DELETED` 상태를 추가하면 모든 조회 조건에서 제외 처리를 누락할 위험이 있습니다.
- JWT secret을 약하게 설정하거나 Git에 커밋하면 보안 위험이 큽니다.
- ADMIN 계정 생성 정책을 명확히 정하지 않으면 로컬 테스트가 불편해질 수 있습니다.
- Swagger JWT 설정을 추가해도 Security 설정과 충돌하면 문서 테스트가 막힐 수 있습니다.
- 테스트 범위가 넓어지므로 H2와 MySQL의 차이로 인한 쿼리/DDL 차이를 주의해야 합니다.
