#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="${ROOT_DIR}/.pids"

stop_process() {
  local name="$1"
  local pid_file="${PID_DIR}/${name}.pid"

  if [[ ! -f "${pid_file}" ]]; then
    echo "${name}: no pid file."
    return
  fi

  local pid
  pid="$(cat "${pid_file}")"

  if kill -0 "${pid}" >/dev/null 2>&1; then
    echo "Stopping ${name} with PID ${pid}..."
    kill "${pid}" >/dev/null 2>&1 || true

    for _ in {1..20}; do
      if ! kill -0 "${pid}" >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done

    if kill -0 "${pid}" >/dev/null 2>&1; then
      echo "${name}: forcing stop."
      kill -9 "${pid}" >/dev/null 2>&1 || true
    fi
  else
    echo "${name}: process is not running."
  fi

  rm -f "${pid_file}"
}

stop_process "backend"
stop_process "frontend"

echo "Stopping Prometheus and Grafana..."
docker compose -f "${ROOT_DIR}/docker-compose.monitoring.yml" down

echo "MySQL Homebrew service was not stopped."
echo "Local development environment stopped."
