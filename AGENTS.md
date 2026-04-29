# AGENTS.md

## Project Overview

프로젝트명은 **아껴맵**입니다.

아껴맵은 대학생과 취준생이 학교 주변의 저렴한 식당, 무료 학습 공간, 생활 편의시설을 지도 기반으로 찾고 공유할 수 있는 생활비 절약 지도 서비스입니다.

이 프로젝트의 핵심은 단순 지도 CRUD가 아니라, 사용자가 제보한 장소 정보를 관리자 승인, 신고 처리, 상태값 관리를 통해 신뢰도 있게 운영하는 것입니다.

## Main Goal

이 프로젝트의 1차 목표는 다음 흐름을 로컬 환경에서 완성하는 것입니다.

1. 사용자가 장소를 등록한다.
2. 등록된 장소는 `PENDING` 상태로 저장된다.
3. 관리자가 장소를 승인하면 `APPROVED` 상태가 된다.
4. 승인된 장소만 지도에 마커로 표시된다.
5. 사용자는 장소 상세 정보, 리뷰, 가격 정보를 확인할 수 있다.
6. 잘못된 정보는 신고할 수 있고, 신고가 누적되면 장소를 숨김 처리할 수 있다.

## Tech Stack

### Backend

- Java 17 또는 Java 21
- Spring Boot 3.x
- Spring Web
- Spring Data JPA
- Validation
- Lombok
- PostgreSQL
- H2 Database for local quick testing
- Gradle

### Frontend

- React 또는 Vue
- Vite
- Axios
- React Router 또는 Vue Router
- Kakao Map API 또는 Naver Map API

### Database

- Local: PostgreSQL 권장
- Temporary test: H2 가능
- Later deployment: Supabase PostgreSQL 고려

### Tools

- Backend IDE: IntelliJ IDEA
- Frontend Editor: VS Code
- DB Client: DBeaver
- API Test: Postman 또는 IntelliJ HTTP Client
- Version Control: Git, GitHub

## Project Structure

권장 프로젝트 구조는 다음과 같습니다.

```text
akkyomap/
 ├─ backend/
 ├─ frontend/
 ├─ docs/
 └─ AGENTS.md
```

`backend`는 Spring Boot 프로젝트입니다.  
`frontend`는 React 또는 Vue 프로젝트입니다.  
`docs`에는 요구사항, ERD, API 명세를 정리합니다.

## Documentation Files

`docs` 폴더에는 다음 문서를 유지합니다.

```text
docs/
 ├─ 01_requirements.md
 ├─ 02_erd.md
 └─ 03_api_spec.md
```

각 문서의 역할은 다음과 같습니다.

### 01_requirements.md

- 서비스 목적
- 주요 사용자
- MVP 기능
- 사용자 시나리오
- 관리자 시나리오

### 02_erd.md

- 엔티티 목록
- 주요 필드
- 연관관계
- 상태값 정의

### 03_api_spec.md

- API URL
- HTTP Method
- Request Body
- Response Body
- 예외 상황
- 권한 조건

## Domain Priority

처음부터 모든 기능을 구현하지 않습니다.

개발 우선순위는 다음과 같습니다.

### 1순위

- Place 엔티티
- PlaceStatus enum
- 장소 등록 API
- 장소 목록 조회 API
- 장소 상세 조회 API
- 승인된 장소만 조회하는 API
- 지도 마커 표시용 API

### 2순위

- 관리자 승인 기능
- 관리자 반려 기능
- 리뷰 작성 기능
- 신고 기능

### 3순위

- 로그인
- JWT 인증
- USER / ADMIN 권한 분리
- 즐겨찾기
- 내가 등록한 장소 조회

### 4순위

- 가격 변경 제보
- 신고 누적 자동 숨김
- 거리순 정렬
- 추천순 정렬

### 5순위

- MCP 기반 AI 장소 검색 도구
- 승인 대기 장소 요약
- 신고 많은 장소 요약

## Core Domain

### Place

아껴맵의 핵심 도메인은 `Place`입니다.

초기 필드는 다음을 기준으로 합니다.

```java
private Long id;
private String name;
private PlaceCategory category;
private String address;
private Double latitude;
private Double longitude;
private String priceInfo;
private String description;
private PlaceStatus status;
private LocalDateTime createdAt;
private LocalDateTime updatedAt;
```

처음에는 `User` 연관관계를 강하게 넣지 않아도 됩니다.  
장소 등록, 조회, 승인 흐름이 먼저 동작하도록 구현합니다.

## PlaceStatus

장소 상태값은 다음 enum을 사용합니다.

```java
public enum PlaceStatus {
    PENDING,
    APPROVED,
    REJECTED,
    HIDDEN
}
```

상태 의미는 다음과 같습니다.

- `PENDING`: 사용자가 등록했지만 아직 관리자 승인을 받지 않은 상태
- `APPROVED`: 관리자가 승인하여 지도에 노출 가능한 상태
- `REJECTED`: 관리자가 반려한 상태
- `HIDDEN`: 신고 누적 또는 관리자 판단으로 숨김 처리된 상태

## PlaceCategory

초기 카테고리는 다음 정도로 시작합니다.

```java
public enum PlaceCategory {
    RESTAURANT,
    CAFE,
    STUDY_SPACE,
    PRINT_COPY,
    CONVENIENCE
}
```

표시명은 프론트엔드 또는 enum 내부 필드로 처리할 수 있습니다.

- `RESTAURANT`: 식당
- `CAFE`: 카페
- `STUDY_SPACE`: 공부공간
- `PRINT_COPY`: 프린트/복사
- `CONVENIENCE`: 편의시설

## Initial API Scope

처음 구현할 API는 다음과 같습니다.

```text
POST /api/places
GET /api/places
GET /api/places/{placeId}
GET /api/places/map
```

### POST /api/places

장소를 등록합니다.  
등록된 장소는 기본적으로 `PENDING` 상태가 됩니다.

### GET /api/places

승인된 장소 목록을 조회합니다.  
기본적으로 `APPROVED` 상태의 장소만 반환합니다.

### GET /api/places/{placeId}

장소 상세 정보를 조회합니다.

### GET /api/places/map

지도 범위 내 장소를 조회합니다.

예시 파라미터:

```text
GET /api/places/map?swLat=35.1&swLng=129.0&neLat=35.2&neLng=129.2
```

이 API는 현재 지도 화면 안에 있는 장소만 조회하기 위한 용도입니다.

## Admin API Scope

관리자 기능은 다음 API를 기준으로 합니다.

```text
GET /api/admin/places/pending
PATCH /api/admin/places/{placeId}/approve
PATCH /api/admin/places/{placeId}/reject
PATCH /api/admin/places/{placeId}/hide
PATCH /api/admin/places/{placeId}/restore
```

관리자 API는 추후 Spring Security와 JWT를 적용한 뒤 `ADMIN` 권한만 접근 가능하도록 만듭니다.

초기 개발 단계에서는 인증 없이 동작하게 만들 수 있으나, 코드 주석 또는 TODO로 권한 적용 예정임을 남깁니다.

## Review Feature

리뷰 기능은 다음 정보를 기준으로 합니다.

```java
private Long id;
private Long placeId;
private Integer rating;
private String content;
private Integer crowdedLevel;
private Boolean priceAccurate;
private LocalDate visitedDate;
private LocalDateTime createdAt;
```

리뷰는 장소가 `APPROVED` 상태일 때만 작성할 수 있도록 합니다.

## Report Feature

신고 기능은 잘못된 장소 정보를 관리하기 위한 기능입니다.

신고 사유는 다음 enum을 기준으로 합니다.

```java
public enum ReportReason {
    WRONG_PRICE,
    CLOSED_PLACE,
    INAPPROPRIATE_CONTENT,
    DUPLICATED_PLACE,
    ETC
}
```

신고 처리 규칙은 다음과 같습니다.

1. 사용자가 장소를 신고한다.
2. 신고 내역을 저장한다.
3. 특정 장소의 신고 수가 누적된다.
4. 신고가 3회 이상 누적되면 장소 상태를 `HIDDEN`으로 변경할 수 있다.
5. 관리자는 신고 내용을 확인한 뒤 장소를 복구하거나 계속 숨김 처리할 수 있다.

초기 구현에서는 자동 숨김 처리를 바로 넣지 않아도 됩니다.  
먼저 신고 저장 기능을 구현하고, 이후 자동 숨김 로직을 추가합니다.

## Coding Rules

### General

- 기능을 한 번에 크게 만들지 말고 작은 단위로 구현합니다.
- 먼저 동작하는 코드를 만들고, 이후 리팩터링합니다.
- 비즈니스 로직은 Controller에 두지 말고 Service에 둡니다.
- Entity를 API 응답으로 직접 반환하지 않습니다.
- Request DTO와 Response DTO를 분리합니다.
- 상태 변경 로직은 명확한 메서드 이름으로 표현합니다.

예시:

```java
place.approve();
place.reject();
place.hide();
place.restore();
```

### Controller

- Controller는 요청을 받고 Service를 호출하는 역할만 합니다.
- 복잡한 조건문은 Controller에 작성하지 않습니다.
- 응답 DTO를 반환합니다.

### Service

- 핵심 비즈니스 로직은 Service에 작성합니다.
- 장소 상태 변경, 신고 누적 처리, 승인/반려 처리는 Service에서 담당합니다.
- 트랜잭션이 필요한 메서드에는 `@Transactional`을 적용합니다.
- 조회 전용 메서드에는 `@Transactional(readOnly = true)`를 적용합니다.

### Repository

- 기본 CRUD는 Spring Data JPA Repository를 사용합니다.
- 복잡한 검색 조건이 늘어나면 QueryDSL 도입을 고려합니다.
- 초기 MVP에서는 단순 Repository 메서드로 시작합니다.

### DTO

- 요청 DTO 이름은 `Create`, `Update`, `Request`를 조합합니다.
- 응답 DTO 이름은 `Response`로 끝냅니다.

예시:

```text
PlaceCreateRequest
PlaceUpdateRequest
PlaceResponse
PlaceDetailResponse
PlaceMapResponse
```

## Error Handling

최종적으로는 공통 예외 처리 구조를 사용합니다.

권장 구조는 다음과 같습니다.

```text
global/
 ├─ exception/
 │   ├─ BusinessException.java
 │   ├─ ErrorCode.java
 │   └─ GlobalExceptionHandler.java
 └─ response/
     └─ ApiResponse.java
```

초기에는 단순 예외로 시작해도 되지만, 기능이 2개 이상 붙으면 공통 예외 처리를 도입합니다.

응답 형식은 다음 구조를 권장합니다.

```json
{
  "success": true,
  "message": "요청이 성공했습니다.",
  "data": {}
}
```

실패 응답은 다음 구조를 권장합니다.

```json
{
  "success": false,
  "message": "장소를 찾을 수 없습니다.",
  "data": null
}
```

## Testing Rules

Codex가 기능을 구현하거나 수정할 때는 가능한 경우 테스트 코드도 함께 제안해야 합니다.

우선순위는 다음과 같습니다.

1. Service 단위 테스트
2. Controller 테스트
3. Repository 테스트
4. 통합 테스트

테스트는 JUnit5와 Mockito를 기준으로 작성합니다.

중요하게 테스트할 흐름은 다음과 같습니다.

- 장소 등록 시 기본 상태가 `PENDING`인지 확인
- 승인된 장소만 목록에 조회되는지 확인
- 관리자가 장소를 승인하면 상태가 `APPROVED`로 변경되는지 확인
- 반려하면 상태가 `REJECTED`로 변경되는지 확인
- 숨김 처리하면 상태가 `HIDDEN`으로 변경되는지 확인
- 존재하지 않는 장소 조회 시 예외가 발생하는지 확인

## Git Rules

커밋 메시지는 다음 형식을 권장합니다.

```text
feat: 장소 등록 API 구현
fix: 승인된 장소만 조회되도록 조건 수정
refactor: Place 상태 변경 로직 엔티티 메서드로 분리
test: PlaceService 승인 로직 테스트 추가
docs: API 명세 문서 추가
```

가능하면 하나의 커밋에는 하나의 목적만 담습니다.

## Codex Working Rules

Codex는 작업 시 다음 원칙을 지켜야 합니다.

1. 기존 구조를 먼저 확인한 뒤 코드를 수정합니다.
2. 불필요하게 큰 구조 변경을 하지 않습니다.
3. 사용자가 요청하지 않은 기술을 임의로 추가하지 않습니다.
4. 새로운 의존성을 추가하기 전에는 이유를 설명합니다.
5. Entity를 직접 응답하지 않고 DTO를 사용합니다.
6. Controller에 비즈니스 로직을 넣지 않습니다.
7. 테스트 가능한 구조로 작성합니다.
8. 기능 구현 후 관련 테스트 코드 또는 테스트 방법을 함께 제안합니다.
9. README 또는 docs 수정이 필요한 경우 함께 제안합니다.
10. 보안과 권한이 필요한 기능에는 TODO 또는 주석으로 후속 작업을 명시합니다.

## MVP Completion Criteria

1차 MVP 완료 기준은 다음과 같습니다.

- 장소 등록 API가 동작한다.
- 등록된 장소는 `PENDING` 상태로 저장된다.
- 관리자가 장소를 승인할 수 있다.
- 승인된 장소만 목록에 조회된다.
- 승인된 장소만 지도 마커 API에 포함된다.
- 장소 상세 조회가 가능하다.
- 사용자는 장소를 신고할 수 있다.
- 관리자는 신고된 장소를 숨김 처리할 수 있다.
- 주요 Service 로직에 테스트 코드가 존재한다.
- README에 프로젝트 소개, 실행 방법, 주요 기능, API 요약이 정리되어 있다.

## Later Expansion

MVP 이후 확장 기능은 다음과 같습니다.

- JWT 로그인
- USER / ADMIN 권한 분리
- 즐겨찾기
- 내가 등록한 장소 조회
- 가격 변경 제보
- 거리순 정렬
- 추천순 정렬
- QueryDSL 기반 동적 검색
- MCP 기반 AI 장소 검색 도구
- 관리자용 승인 대기 장소 요약
- 신고 많은 장소 요약

## Important Portfolio Direction

이 프로젝트는 단순히 지도에 마커를 찍는 프로젝트가 아닙니다.

포트폴리오에서 강조할 핵심은 다음입니다.

1. 지도 기반 장소 조회
   - 현재 지도 범위 내 장소만 조회하여 불필요한 데이터 응답을 줄입니다.

2. 사용자 제보 신뢰도 관리
   - 장소 상태를 `PENDING`, `APPROVED`, `REJECTED`, `HIDDEN`으로 나누고, 관리자 승인과 신고 처리를 통해 정보 신뢰도를 관리합니다.

3. 운영 가능한 관리자 기능
   - 승인 대기 장소, 신고 장소, 숨김/복구 처리를 분리하여 실제 서비스 운영 흐름을 고려합니다.

4. AI 도구 활용
   - Codex는 반복 코드 작성과 테스트 코드 초안 작성에 활용하고, 최종 도메인 규칙과 예외 처리는 개발자가 직접 검토합니다.

## Do Not Do

다음 작업은 사용자가 명시적으로 요청하기 전까지 하지 않습니다.

- 처음부터 로그인/JWT를 강하게 결합하지 않기
- 처음부터 QueryDSL을 도입하지 않기
- 처음부터 MSA 구조로 나누지 않기
- 처음부터 Docker, CI/CD를 필수로 만들지 않기
- Entity를 그대로 API 응답으로 반환하지 않기
- 지도 API 키를 코드에 직접 작성하지 않기
- 관리자 기능을 일반 사용자 API와 섞지 않기
- 기능이 동작하기 전에 과도한 추상화부터 하지 않기

## First Implementation Target

가장 먼저 구현할 목표는 다음입니다.

```text
Place 등록 → PENDING 저장 → 관리자 승인 → APPROVED 장소 목록 조회
```

이 흐름이 완성된 뒤 지도 마커 표시, 리뷰, 신고 기능을 추가합니다.
