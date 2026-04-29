#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.local"
LOG_DIR="${ROOT_DIR}/logs"
PID_DIR="${ROOT_DIR}/.pids"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing .env.local. Create it from .env.local.example first."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

mkdir -p "${LOG_DIR}" "${PID_DIR}"

echo "Starting MySQL with Homebrew service..."
brew services start mysql

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Opening Docker Desktop..."
  open -a Docker
fi

echo "Waiting for Docker to be ready..."
for _ in {1..60}; do
  if docker info >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! docker info >/dev/null 2>&1; then
  echo "Docker did not become ready in time."
  exit 1
fi

echo "Starting Prometheus and Grafana..."
docker compose -f "${ROOT_DIR}/docker-compose.monitoring.yml" up -d

if [[ -f "${PID_DIR}/backend.pid" ]] && kill -0 "$(cat "${PID_DIR}/backend.pid")" >/dev/null 2>&1; then
  echo "Backend is already running with PID $(cat "${PID_DIR}/backend.pid")."
else
  echo "Starting backend..."
  (
    cd "${ROOT_DIR}/backend"
    exec ./gradlew bootRun
  ) >"${LOG_DIR}/backend.log" 2>&1 &
  echo $! >"${PID_DIR}/backend.pid"
fi

if [[ -f "${PID_DIR}/frontend.pid" ]] && kill -0 "$(cat "${PID_DIR}/frontend.pid")" >/dev/null 2>&1; then
  echo "Frontend is already running with PID $(cat "${PID_DIR}/frontend.pid")."
else
  echo "Starting frontend..."
  (
    cd "${ROOT_DIR}/frontend"
    exec npm run dev
  ) >"${LOG_DIR}/frontend.log" 2>&1 &
  echo $! >"${PID_DIR}/frontend.pid"
fi

echo
echo "Akkyomap local development environment is starting."
echo "Logs:"
echo "  Backend:  ${LOG_DIR}/backend.log"
echo "  Frontend: ${LOG_DIR}/frontend.log"
echo
echo "URLs:"
echo "  Frontend:        http://localhost:5173"
echo "  Backend Swagger: http://localhost:8080/swagger-ui/index.html"
echo "  Actuator:        http://localhost:8080/actuator/health"
echo "  Prometheus:      http://localhost:9090"
echo "  Grafana:         http://localhost:3000"
