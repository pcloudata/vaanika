#!/usr/bin/env bash
set -euo pipefail

echo "[1/4] Unit/integration tests"
npm test

echo "[2/4] Typecheck"
npx tsc --noEmit

echo "[3/4] Web E2E"
npm run e2e:web

echo "[4/4] DB verification"
node scripts/db-verify.mjs

echo "Web preflight passed."
