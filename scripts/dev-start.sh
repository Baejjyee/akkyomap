#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.local"
LOG_DIR="${ROOT_DIR}/logs"
PID_DIR="${ROOT_DIR}/.pids"
FOLLOW_BACKEND_LOG=false

case "${1:-}" in
  -f|--follow)
    FOLLOW_BACKEND_LOG=true
    ;;
  "")
    ;;
  *)
    echo "Usage: ./scripts/dev-start.sh [--follow|-f]"
    exit 1
    ;;
esac

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing .env.local. Create it from .env.local.example first."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

mkdir -p "${LOG_DIR}" "${PID_DIR}"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}"
    echo "Set ${name} in ${ENV_FILE} before running this script."
    exit 1
  fi
}

is_mysql_running() {
  if command -v mysqladmin >/dev/null 2>&1 && mysqladmin ping -h 127.0.0.1 -P 3306 --silent >/dev/null 2>&1; then
    return 0
  fi

  if command -v nc >/dev/null 2>&1 && nc -z 127.0.0.1 3306 >/dev/null 2>&1; then
    return 0
  fi

  return 1
}

is_port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
    return 0
  fi

  if command -v nc >/dev/null 2>&1 && nc -z 127.0.0.1 "${port}" >/dev/null 2>&1; then
    return 0
  fi

  return 1
}

stop_pid_file_process() {
  local name="$1"
  local pid_file="$2"

  if [[ -f "${pid_file}" ]] && kill -0 "$(cat "${pid_file}")" >/dev/null 2>&1; then
    local pid
    pid="$(cat "${pid_file}")"
    echo "${name} is already running with PID ${pid}. Stopping it so the latest .env.local values are applied..."
    kill "${pid}" >/dev/null 2>&1 || true

    for _ in {1..15}; do
      if ! kill -0 "${pid}" >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done

    if kill -0 "${pid}" >/dev/null 2>&1; then
      echo "Could not stop ${name} process ${pid}."
      echo "Run ./scripts/dev-stop.sh, then retry ./scripts/dev-start.sh."
      exit 1
    fi
  fi

  rm -f "${pid_file}"
}

require_env DB_USERNAME
require_env DB_PASSWORD
require_env JWT_SECRET
echo "Required backend environment variables are present: DB_USERNAME, DB_PASSWORD, JWT_SECRET."

echo "Starting MySQL with Homebrew service..."
if ! brew services start mysql; then
  echo "Warning: 'brew services start mysql' failed. Checking whether MySQL is already reachable..."
fi

if is_mysql_running; then
  echo "MySQL is reachable on localhost:3306. Continuing."
else
  echo "MySQL is not reachable on localhost:3306."
  echo "Check MySQL status with: brew services list"
  echo "Try starting it manually with: brew services start mysql"
  echo "If Homebrew service has a launchctl issue, check logs with: brew services info mysql"
  exit 1
fi

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

stop_pid_file_process "Backend" "${PID_DIR}/backend.pid"

if is_port_in_use 8080; then
  echo "Port 8080 is already in use. An existing backend may still be running."
  echo "Run ./scripts/dev-stop.sh or stop the process using port 8080, then retry."
  exit 1
fi

echo "Starting backend..."
(
  cd "${ROOT_DIR}/backend"
  exec ./gradlew bootRun
) >"${LOG_DIR}/backend.log" 2>&1 &
echo $! >"${PID_DIR}/backend.pid"

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
echo "Log commands:"
echo "  tail -f ${LOG_DIR}/backend.log"
echo "  tail -f ${LOG_DIR}/frontend.log"
echo
echo "URLs:"
echo "  Frontend:        http://localhost:5173"
echo "  Backend Swagger: http://localhost:8080/swagger-ui/index.html"
echo "  Actuator:        http://localhost:8080/actuator/health"
echo "  Prometheus:      http://localhost:9090"
echo "  Grafana:         http://localhost:3000"

if [[ "${FOLLOW_BACKEND_LOG}" == "true" ]]; then
  echo
  echo "Following backend log. Press Ctrl+C to stop following logs."
  tail -f "${LOG_DIR}/backend.log"
fi
