# Observability 도입 계획

## 계획 범위

이 문서는 아껴맵 백엔드에 테스트 커버리지와 로컬 운영 모니터링 도구를 추가하기 위한 계획입니다.

이번 단계에서는 Spring Boot 애플리케이션과 MySQL을 Docker로 옮기지 않습니다. 백엔드는 기존처럼 로컬에서 실행하고, Prometheus와 Grafana만 Docker Compose로 실행하는 방향으로 구성합니다.

Place Entity, Service, Controller 비즈니스 로직과 기존 API 요청/응답 구조는 변경하지 않습니다. frontend 코드는 수정하지 않습니다.

## 구현 목표

- JaCoCo를 적용해 테스트 커버리지 리포트를 생성합니다.
- Spring Boot Actuator를 추가해 health, metrics를 확인합니다.
- Micrometer Prometheus Registry를 추가해 `/actuator/prometheus` 엔드포인트를 노출합니다.
- Prometheus가 Spring Boot의 `/actuator/prometheus`를 scrape하도록 설정합니다.
- Grafana가 Prometheus를 datasource로 사용하도록 로컬 최소 설정을 추가합니다.
- README에 실행 방법, 확인 URL, 커버리지 리포트 위치를 정리합니다.
- 기존 MySQL local 설정과 H2 test profile을 유지합니다.
- `./gradlew test`가 계속 성공해야 합니다.

## 추가할 도구와 역할

### JaCoCo

- Gradle 테스트 커버리지 리포트를 생성합니다.
- HTML 리포트로 Service, Entity 등 테스트 커버리지 현황을 확인합니다.
- CI 연동은 이번 단계에서 제외합니다.

### Spring Boot Actuator

- 애플리케이션 상태와 운영 지표 엔드포인트를 제공합니다.
- 주요 확인 엔드포인트:
  - `/actuator/health`
  - `/actuator/metrics`
  - `/actuator/prometheus`

### Micrometer Prometheus Registry

- Actuator metrics를 Prometheus 포맷으로 노출합니다.
- Prometheus는 이 엔드포인트를 주기적으로 수집합니다.

### Prometheus

- 로컬 Spring Boot 앱의 `/actuator/prometheus`를 scrape합니다.
- Docker Compose로 Prometheus 컨테이너만 실행합니다.

### Grafana

- Prometheus를 datasource로 사용합니다.
- 최소 provisioning 설정으로 datasource를 자동 등록합니다.
- 대시보드 JSON은 이번 단계에서 필수로 만들지 않고, 필요 시 후속 작업에서 추가합니다.

## 수정/생성할 파일

구현 승인 후 수정/생성 후보 파일은 다음입니다.

```text
backend/build.gradle
backend/src/main/resources/application.yml
backend/src/main/resources/application-local.yml
backend/src/test/resources/application-test.yml
monitoring/prometheus/prometheus.yml
monitoring/grafana/provisioning/datasources/prometheus.yml
docker-compose.monitoring.yml
README.md
docs/plans/OBSERVABILITY_PLAN.md
```

주의:

- Place Entity, Service, Controller 비즈니스 로직은 수정하지 않습니다.
- 기존 API 요청/응답 구조는 변경하지 않습니다.
- frontend 코드는 수정하지 않습니다.
- MySQL local 설정은 유지합니다.
- test profile은 H2로 유지합니다.

## build.gradle 변경 사항

추가할 플러그인:

```gradle
plugins {
    id 'jacoco'
}
```

추가할 의존성:

```gradle
implementation 'org.springframework.boot:spring-boot-starter-actuator'
runtimeOnly 'io.micrometer:micrometer-registry-prometheus'
```

JaCoCo 리포트 설정 방향:

```gradle
jacoco {
    toolVersion = '0.8.12'
}

tasks.named('test') {
    useJUnitPlatform()
    systemProperty 'spring.profiles.active', 'test'
    finalizedBy 'jacocoTestReport'
}

tasks.named('jacocoTestReport') {
    dependsOn test
    reports {
        html.required = true
        xml.required = true
        csv.required = false
    }
}
```

커버리지 기준 강제는 이번 단계에서 제외합니다. 먼저 리포트 생성과 확인에 집중합니다.

## Actuator endpoint 노출 설정

`application-local.yml` 또는 공통 `application.yml`에 Actuator 노출 설정을 추가합니다.

권장 방향:

- local profile에서만 필요한 엔드포인트를 노출합니다.
- 외부 운영 환경 보안 설정은 이번 단계에서 다루지 않습니다.

예상 설정:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
  metrics:
    tags:
      application: akkyomap-backend
```

확인 URL:

```text
http://localhost:8080/actuator/health
http://localhost:8080/actuator/metrics
http://localhost:8080/actuator/prometheus
```

test profile에도 Actuator 설정이 있어도 무방하지만, 테스트가 모니터링 도구에 의존하지 않도록 별도 외부 서비스는 사용하지 않습니다.

## Prometheus scrape 설정

생성 파일:

```text
monitoring/prometheus/prometheus.yml
```

Spring Boot 앱은 로컬 호스트에서 실행하고 Prometheus는 Docker 컨테이너에서 실행합니다. Docker Desktop 환경에서 컨테이너가 호스트의 Spring Boot 앱에 접근하려면 `host.docker.internal:8080`을 사용합니다.

예상 설정:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'akkyomap-backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8080']
```

Linux 환경에서 `host.docker.internal`이 동작하지 않는 경우 `extra_hosts` 설정 또는 호스트 IP 사용이 필요할 수 있습니다.

## Grafana datasource 설정 방향

생성 파일:

```text
monitoring/grafana/provisioning/datasources/prometheus.yml
```

Prometheus datasource 자동 등록 설정:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

이번 단계에서는 datasource 자동 등록까지만 필수로 합니다. 대시보드 provisioning은 후속 작업으로 남길 수 있습니다.

## docker-compose.monitoring.yml

생성 파일:

```text
docker-compose.monitoring.yml
```

구성 방향:

- Prometheus 컨테이너
- Grafana 컨테이너
- Spring Boot 앱과 MySQL은 포함하지 않음

예상 구성:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3000:3000'
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
    depends_on:
      - prometheus
```

Grafana 기본 로그인:

```text
ID: admin
Password: admin
```

필요하면 최초 로그인 후 비밀번호를 변경합니다.

## JaCoCo 실행 명령어

테스트와 커버리지 리포트 생성:

```bash
cd backend
./gradlew test
```

명시적으로 리포트만 다시 생성:

```bash
cd backend
./gradlew jacocoTestReport
```

## 커버리지 리포트 위치

HTML 리포트:

```text
backend/build/reports/jacoco/test/html/index.html
```

XML 리포트:

```text
backend/build/reports/jacoco/test/jacocoTestReport.xml
```

초기에는 브라우저에서 HTML 리포트를 확인합니다.

## 로컬 실행 순서

1. MySQL을 실행하고 `akkyomap` DB가 준비되어 있는지 확인합니다.
2. 백엔드를 local profile로 실행합니다.

```bash
cd backend
DB_USERNAME=akkyomap DB_PASSWORD='로컬_DB_비밀번호' ./gradlew bootRun
```

3. Actuator 엔드포인트를 확인합니다.

```text
http://localhost:8080/actuator/health
http://localhost:8080/actuator/prometheus
```

4. Prometheus와 Grafana를 실행합니다.

```bash
docker compose -f docker-compose.monitoring.yml up
```

5. Prometheus target 상태를 확인합니다.

```text
http://localhost:9090/targets
```

6. Grafana에 접속합니다.

```text
http://localhost:3000
```

7. Grafana datasource로 Prometheus가 등록되었는지 확인합니다.

## 검증 방법

구현 후 다음 항목을 확인합니다.

- `./gradlew test` 성공
- JaCoCo HTML 리포트 생성
- `http://localhost:8080/actuator/health` 응답 확인
- `http://localhost:8080/actuator/metrics` 응답 확인
- `http://localhost:8080/actuator/prometheus` 응답 확인
- Prometheus `http://localhost:9090/targets`에서 `akkyomap-backend` target이 UP인지 확인
- Grafana `http://localhost:3000`에서 Prometheus datasource가 등록되었는지 확인
- 기존 Place API 요청/응답이 변경되지 않았는지 확인
- MySQL local 설정과 H2 test profile이 유지되는지 확인

## README 반영 내용

README에는 다음 내용을 간단히 추가합니다.

- JaCoCo 실행 명령어
- 커버리지 HTML 리포트 위치
- 백엔드 Actuator 확인 URL
- Prometheus/Grafana 실행 명령어
- Prometheus/Grafana 접속 URL
- Spring Boot 앱과 DB는 Docker Compose에 포함하지 않는다는 설명

## 이번 단계에서 제외할 것

- Place Entity, Service, Controller 비즈니스 로직 변경
- 기존 API 요청/응답 구조 변경
- frontend 코드 변경
- MySQL local 설정 변경
- test profile을 MySQL로 변경
- Spring Boot 앱 Docker 이미지화
- MySQL Docker Compose 구성
- 운영 배포 설정
- CI/CD 연동
- JaCoCo 커버리지 기준 강제
- Grafana 대시보드 세부 튜닝
- Sentry
- Loki
- ELK

Sentry, Loki, ELK는 향후 에러 추적과 로그 수집 확장 후보로만 남깁니다.

## 예상 위험 요소

- Actuator 엔드포인트를 과하게 노출하면 운영 환경에서 보안 위험이 생길 수 있습니다.
- Prometheus 컨테이너에서 호스트의 Spring Boot 앱에 접근할 때 OS별 네트워크 차이가 있을 수 있습니다.
- `host.docker.internal`은 Docker Desktop에서는 일반적으로 동작하지만 Linux에서는 별도 설정이 필요할 수 있습니다.
- Grafana/Prometheus 포트 `3000`, `9090`이 이미 사용 중이면 실행이 실패합니다.
- JaCoCo 리포트 생성은 성공해도 현재 테스트 범위가 Service/Entity 중심이라 전체 커버리지가 낮게 보일 수 있습니다.
- Actuator와 Prometheus 의존성 추가로 노출 엔드포인트가 늘어나므로 운영 배포 전에는 보안 정책을 별도로 정해야 합니다.
- Docker Compose는 모니터링 도구만 실행하므로 백엔드 앱이 꺼져 있으면 Prometheus target은 DOWN으로 표시됩니다.

