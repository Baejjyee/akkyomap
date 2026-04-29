# MySQL 로컬 연결 계획

## 계획 범위

이 문서는 아껴맵 백엔드를 로컬 MySQL 데이터베이스에 연결할 수 있도록 확장하기 위한 계획입니다.

이번 단계의 목표는 `local` 실행 환경에서 MySQL `akkyomap` 데이터베이스를 사용할 수 있게 준비하는 것입니다. 기존 Place Entity, Service, Controller 비즈니스 로직은 변경하지 않습니다.

## 구현 목표

- 로컬 MySQL 데이터베이스 `akkyomap`에 연결할 수 있게 합니다.
- Spring Boot에서 MySQL Driver를 사용합니다.
- `application-local.yml`에 MySQL datasource 설정을 둡니다.
- 실제 DB 비밀번호는 코드에 직접 하드코딩하지 않습니다.
- 기존 테스트는 H2를 유지하거나 별도 test 설정으로 분리해 깨지지 않게 합니다.
- README 또는 docs에 MySQL 실행 및 DB 생성 방법을 추가할지 검토합니다.

## 구현 결정

- `application-local.yml`은 MySQL을 기본 datasource로 사용합니다.
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 환경변수를 지원합니다.
- 로컬 기본값은 `jdbc:mysql://localhost:3306/akkyomap?...`, username `akkyomap`입니다.
- password 기본값은 빈 값이며 실제 비밀번호는 환경변수로 전달합니다.
- `application-test.yml`은 H2 메모리 DB를 사용합니다.
- Gradle `test` task는 `spring.profiles.active=test`를 적용합니다.

## 현재 H2 설정 확인 내용

현재 `backend/src/main/resources/application.yml`은 기본 active profile을 `local`로 설정합니다.

```yaml
spring:
  profiles:
    active: local
```

현재 `backend/src/main/resources/application-local.yml`은 H2 메모리 DB를 사용합니다.

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:akkyomap;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
  jpa:
    hibernate:
      ddl-auto: create-drop
```

현재 `backend/build.gradle`에는 H2와 PostgreSQL runtime 의존성이 있습니다.

```gradle
runtimeOnly 'com.h2database:h2'
runtimeOnly 'org.postgresql:postgresql'
```

테스트는 `PlaceTest`, `PlaceServiceTest` 중심이며, 현재 H2 기반 설정을 유지하는 편이 안전합니다.

## 수정할 파일

구현 승인 후 수정 후보 파일은 다음입니다.

```text
backend/build.gradle
backend/src/main/resources/application-local.yml
backend/src/test/resources/application-test.yml
README.md 또는 docs/
```

필요 시 `backend/src/test/resources/application-test.yml`을 새로 추가합니다.

주의:

- Place Entity, Service, Controller 비즈니스 로직은 수정하지 않습니다.
- frontend 코드는 수정하지 않습니다.
- Docker, 배포 설정, CI/CD는 이번 단계에 포함하지 않습니다.

## build.gradle 의존성 변경

MySQL Driver를 추가합니다.

```gradle
runtimeOnly 'com.mysql:mysql-connector-j'
```

H2는 테스트와 빠른 검증용으로 유지합니다.

```gradle
runtimeOnly 'com.h2database:h2'
```

PostgreSQL 의존성은 현재 사용하지 않는다면 제거할 수 있지만, 이번 변경의 목적은 MySQL local 연결 확장이므로 우선 제거하지 않고 유지 여부를 별도로 판단합니다.

## application-local.yml 설정 방향

`local` profile은 MySQL을 기본으로 사용하도록 바꿉니다.

권장 설정 방향:

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/akkyomap?serverTimezone=Asia/Seoul&characterEncoding=UTF-8}
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: ${DB_USERNAME:akkyomap}
    password: ${DB_PASSWORD:}
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        format_sql: true
    open-in-view: false
```

환경변수 정책:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`를 우선 사용합니다.
- `application-local.yml`에는 로컬 개발용 기본 URL과 username만 둡니다.
- password 기본값은 빈 값으로 두거나, 로컬 개발자가 직접 환경변수로 설정합니다.
- 실제 개인 DB 비밀번호는 코드와 Git에 커밋하지 않습니다.

`ddl-auto` 정책:

- 로컬 개발 편의를 위해 초기에는 `update`를 권장합니다.
- 스키마를 매번 초기화해야 하는 경우에만 개발자가 명시적으로 `create` 또는 `create-drop`을 사용합니다.
- 운영 배포 또는 마이그레이션 도구 도입은 이번 단계에서 제외합니다.

H2 console:

- MySQL local profile에서는 H2 console을 비활성화하거나 설정을 제거합니다.
- H2 console은 test 또는 별도 h2 profile을 둘 때만 사용합니다.

## 테스트 환경 유지 방식

테스트가 MySQL 실행 여부에 의존하지 않도록 H2를 유지합니다.

권장 방식:

1. `backend/src/test/resources/application-test.yml`을 추가합니다.
2. 테스트 datasource는 H2 메모리 DB로 설정합니다.
3. 테스트 실행 시 `test` profile을 사용하도록 구성합니다.

예상 test 설정:

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:akkyomap-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    properties:
      hibernate:
        format_sql: true
    open-in-view: false
```

테스트 profile 적용 후보:

- 테스트 클래스에 `@ActiveProfiles("test")` 추가
- 또는 Gradle test task에 system property로 `spring.profiles.active=test` 지정

이번 단계에서는 테스트 안정성을 우선하므로, MySQL 서버가 없어도 `./gradlew test`가 성공해야 합니다.

## 로컬 MySQL DB 생성 SQL

로컬 MySQL에서 다음 SQL로 데이터베이스와 사용자를 준비합니다.

```sql
CREATE DATABASE akkyomap
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER 'akkyomap'@'localhost' IDENTIFIED BY 'local_password';

GRANT ALL PRIVILEGES ON akkyomap.* TO 'akkyomap'@'localhost';

FLUSH PRIVILEGES;
```

이미 같은 사용자가 있다면 `CREATE USER` 대신 비밀번호 변경 또는 권한 부여만 수행합니다.

```sql
ALTER USER 'akkyomap'@'localhost' IDENTIFIED BY 'local_password';
GRANT ALL PRIVILEGES ON akkyomap.* TO 'akkyomap'@'localhost';
FLUSH PRIVILEGES;
```

## local profile 실행 명령어

환경변수로 비밀번호를 지정해서 실행합니다.

macOS/Linux 예시:

```bash
cd backend
DB_USERNAME=akkyomap DB_PASSWORD=local_password ./gradlew bootRun
```

DB URL까지 명시하는 경우:

```bash
cd backend
DB_URL='jdbc:mysql://localhost:3306/akkyomap?serverTimezone=Asia/Seoul&characterEncoding=UTF-8' \
DB_USERNAME=akkyomap \
DB_PASSWORD=local_password \
./gradlew bootRun
```

IntelliJ 실행 설정에서는 다음 환경변수를 등록합니다.

```text
DB_USERNAME=akkyomap
DB_PASSWORD=local_password
```

## 검증 방법

구현 후 다음 순서로 검증합니다.

1. MySQL 서버가 실행 중인지 확인합니다.
2. `akkyomap` 데이터베이스가 존재하는지 확인합니다.
3. 백엔드 테스트가 H2로 성공하는지 확인합니다.

```bash
cd backend
./gradlew test
```

4. MySQL 환경변수를 지정하고 백엔드를 실행합니다.

```bash
DB_USERNAME=akkyomap DB_PASSWORD=local_password ./gradlew bootRun
```

5. Swagger UI 또는 HTTP Client로 장소 등록 API를 호출합니다.

```text
POST /api/places
GET /api/places
GET /api/places/map
```

6. MySQL에서 `place` 테이블과 데이터가 생성되었는지 확인합니다.

```sql
USE akkyomap;
SHOW TABLES;
SELECT * FROM place;
```

## README 또는 docs 반영 검토

구현 후 README 또는 docs에 다음 내용을 추가하는 것이 좋습니다.

- MySQL 설치 또는 실행 전제
- `akkyomap` DB 생성 SQL
- `DB_USERNAME`, `DB_PASSWORD`, `DB_URL` 환경변수 설명
- `./gradlew test`는 H2로 실행된다는 설명
- Swagger 접속 URL

README 정리는 현재 다음 우선순위 후보 중 하나이므로, MySQL 구현 직후 별도 문서 작업으로 진행할 수 있습니다.

## 이번 단계에서 제외할 것

- Place Entity, Service, Controller 비즈니스 로직 변경
- API 요청/응답 구조 변경
- frontend 코드 변경
- Docker 기반 MySQL 실행 구성
- Docker Compose
- 운영 배포 설정
- CI/CD 설정
- Flyway 또는 Liquibase 같은 마이그레이션 도구 도입
- QueryDSL 도입
- 로그인/JWT 또는 권한 분리

## 예상 위험 요소

- MySQL 예약어, enum 처리, timestamp 처리 방식이 H2와 다를 수 있습니다.
- `ddl-auto=update`는 로컬 개발에는 편하지만 스키마 변경 이력을 관리하지 못합니다.
- 테스트가 local profile을 그대로 사용하면 MySQL 서버가 없을 때 실패할 수 있으므로 test profile 분리가 필요합니다.
- DB 비밀번호를 `application-local.yml`에 직접 적으면 Git에 노출될 수 있습니다.
- 기존 PostgreSQL 의존성과 H2 설정이 남아 있어 profile별 DB 목적이 불명확해질 수 있습니다.
- MySQL 문자셋이 `utf8mb4`가 아니면 한글 장소명/주소 저장에서 문제가 생길 수 있습니다.
- 로컬 MySQL timezone 설정이 맞지 않으면 `createdAt`, `updatedAt` 확인 시 시간이 어긋나 보일 수 있습니다.
