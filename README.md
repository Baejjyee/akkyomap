# akkyomap

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
DB_USERNAME=akkyomap DB_PASSWORD=local_password ./gradlew bootRun
```

DB URL까지 지정해야 하는 경우:

```bash
DB_URL='jdbc:mysql://localhost:3306/akkyomap?serverTimezone=Asia/Seoul&characterEncoding=UTF-8' \
DB_USERNAME=akkyomap \
DB_PASSWORD=local_password \
./gradlew bootRun
```

테스트는 `test` profile과 H2 메모리 DB를 사용하므로 로컬 MySQL 서버 없이 실행됩니다.

```bash
cd backend
./gradlew test
```

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
