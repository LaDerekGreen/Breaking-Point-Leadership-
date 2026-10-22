#!/usr/bin/env bash
# Drops and recreates both schemas, applies migrations. Development only.
set -euo pipefail
cd "$(dirname "$0")/.."
ADMIN="${DATABASE_ADMIN_URL:-postgresql://postgres@localhost:5432/gapreader}"
psql "$ADMIN" -q -c 'DROP SCHEMA IF EXISTS org CASCADE; DROP SCHEMA IF EXISTS personal CASCADE;'
psql "$ADMIN" -q -f db/setup.sql
npm run -s db:migrate
