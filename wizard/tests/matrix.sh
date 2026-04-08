#!/bin/sh
set -eu
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
command -v docker > /dev/null 2>&1 || { echo "docker introuvable" >&2; exit 2; }
failure_count=0
for image in alpine:3.20 debian:12-slim bash:5.2; do
    echo "==> $image"
    docker run --rm -v "$REPO_ROOT":/work -w /work "$image" sh -c '
        if command -v apk > /dev/null 2>&1; then apk add --no-cache shellcheck > /dev/null 2>&1
        elif command -v apt-get > /dev/null 2>&1; then apt-get update -qq && apt-get install -y -qq shellcheck > /dev/null
        fi
        ./wizard/tests/run.sh
    ' || failure_count=$((failure_count + 1))
done
[ "$failure_count" -gt 0 ] && { echo "FAIL: $failure_count image(s)"; exit 1; }
echo "PASS: matrix green"
exit 0
