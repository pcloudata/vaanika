#!/usr/bin/env bash
set -euo pipefail

echo "[1/4] Unit/integration tests"
npm test

echo "[2/4] Typecheck"
npx tsc --noEmit

echo "[3/4] Web E2E fail-mode"
npm run e2e:web:fail

echo "[4/4] DB verification (fail mode)"
DB_VERIFY_MODE=fail node scripts/db-verify.mjs

echo "Web fail-mode preflight passed."
