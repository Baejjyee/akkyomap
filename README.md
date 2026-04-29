# akkyomap

## Local Dev Automation

노트북을 껐다 켠 뒤에도 한 번에 로컬 개발 환경을 실행할 수 있도록 스크립트를 제공합니다.

전제 조건:

- macOS
- MySQL은 Homebrew service 기준
- Docker Desktop 설치 및 실행 가능
- Spring Boot 앱과 MySQL은 Docker Compose에 포함하지 않음
- Prometheus/Grafana만 Docker Compose로 실행

먼저 루트에 `.env.local`을 만듭니다. 실제 비밀번호는 Git에 커밋하지 않습니다.

```bash
cp .env.local.example .env.local
```

`.env.local` 예시:

```text
DB_USERNAME=akkyomap
DB_PASSWORD=your_local_db_password
JWT_SECRET=your_local_jwt_secret_at_least_32_chars
JWT_ACCESS_TOKEN_EXPIRATION=3600000
```

`DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`은 필수입니다. `JWT_SECRET`은 backend JWT 서명에 사용되며 값 자체를 로그에 출력하지 않습니다.

최초 1회 실행 권한을 부여합니다.

```bash
chmod +x scripts/dev-start.sh scripts/dev-stop.sh
```

로컬 개발 환경 실행:

```bash
./scripts/dev-start.sh
```

서비스 시작 후 backend 로그를 바로 따라가려면 다음 옵션을 사용합니다.

```bash
./scripts/dev-start.sh --follow
# 또는
./scripts/dev-start.sh -f
```

실행되는 작업:

- `brew services start mysql`
- MySQL 서비스 시작 명령이 실패해도 `mysqladmin ping` 또는 3306 포트 확인으로 실제 실행 여부 확인
- Docker Desktop 실행 여부 확인 및 필요 시 `open -a Docker`
- Docker 준비 대기
- `docker compose -f docker-compose.monitoring.yml up -d`
- backend 백그라운드 실행 및 `logs/backend.log` 저장
- frontend 백그라운드 실행 및 `logs/frontend.log` 저장
- pid 파일을 `.pids/`에 저장

로그 확인:

```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

접속 URL:

```text
Frontend: http://localhost:5173
Backend Swagger: http://localhost:8080/swagger-ui/index.html
Actuator: http://localhost:8080/actuator/health
Prometheus: http://localhost:9090
Grafana: http://localhost:3000
```

종료:

```bash
./scripts/dev-stop.sh
```

종료되는 대상:

- `.pids/backend.pid`의 backend 프로세스
- `.pids/frontend.pid`의 frontend 프로세스
- Prometheus/Grafana Docker Compose

MySQL Homebrew service는 기본적으로 종료하지 않습니다.

`brew services start mysql`이 실패하더라도 MySQL이 이미 실행 중이면 스크립트는 계속 진행합니다. 실제 실행 여부는 `mysqladmin ping` 또는 localhost 3306 포트로 확인합니다.

MySQL이 꺼져 있어 스크립트가 중단되면 다음을 확인합니다.

```bash
brew services list
brew services info mysql
mysqladmin ping -h 127.0.0.1 -P 3306 --silent
```

## Backend Local MySQL

로컬 실행 기본 datasource는 MySQL `akkyomap` 데이터베이스입니다.

```sql
CREATE DATABASE akkyomap
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER 'akkyomap'@'localhost' IDENTIFIED BY 'local_password';

GRANT ALL PRIVILEGES ON akkyomap.* TO 'akkyomap'@'localhost';

FLUSH PRIVILEGES;
```

비밀번호는 Git에 커밋하지 않고 환경변수로 전달합니다.

```bash
cd backend
DB_USERNAME=akkyomap \
DB_PASSWORD=local_password \
JWT_SECRET=your_local_jwt_secret_at_least_32_chars \
./gradlew bootRun
```

DB URL까지 지정해야 하는 경우:

```bash
DB_URL='jdbc:mysql://localhost:3306/akkyomap?serverTimezone=Asia/Seoul&characterEncoding=UTF-8' \
DB_USERNAME=akkyomap \
DB_PASSWORD=local_password \
JWT_SECRET=your_local_jwt_secret_at_least_32_chars \
./gradlew bootRun
```

테스트는 `test` profile과 H2 메모리 DB를 사용하므로 로컬 MySQL 서버 없이 실행됩니다.

```bash
cd backend
./gradlew test
```

## Backend JWT Test

회원가입은 기본 `USER` 권한만 생성합니다. `ADMIN` 계정은 로컬 개발 단계에서 DB의 `users.role` 값을 직접 `ADMIN`으로 변경해서 사용합니다.

회원가입:

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123","nickname":"사용자"}'
```

로그인:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}'
```

인증이 필요한 API는 로그인 응답의 `accessToken`을 Bearer 토큰으로 전달합니다.

```bash
curl http://localhost:8080/api/places/me \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Swagger UI에서도 우측 상단 `Authorize` 버튼에 Bearer 토큰을 입력해 인증 API를 테스트할 수 있습니다.

## Backend Observability

테스트와 JaCoCo 커버리지 리포트를 생성합니다.

```bash
cd backend
./gradlew test
```

명시적으로 커버리지 리포트를 생성하려면 다음 명령을 사용할 수 있습니다.

```bash
cd backend
./gradlew test jacocoTestReport
```

커버리지 HTML 리포트 위치:

```text
backend/build/reports/jacoco/test/html/index.html
```

백엔드를 로컬에서 실행한 뒤 Actuator 엔드포인트를 확인합니다.

```text
http://localhost:8080/actuator/health
http://localhost:8080/actuator/metrics
http://localhost:8080/actuator/prometheus
```

Prometheus와 Grafana는 모니터링 도구만 Docker Compose로 실행합니다. Spring Boot 앱과 MySQL은 Docker Compose에 포함하지 않고 기존처럼 로컬에서 실행합니다.

```bash
docker compose -f docker-compose.monitoring.yml up
```

접속 URL:

```text
Prometheus: http://localhost:9090
Prometheus Targets: http://localhost:9090/targets
Grafana: http://localhost:3000
```

Grafana 기본 로그인은 `admin` / `admin`입니다. Prometheus datasource는 provisioning으로 자동 등록됩니다.
