#!/usr/bin/env bash
# Regenerates the two initial migrations from the Prisma schemas and appends
# the CHECK constraints that enforce the hard floors. Development use only.
set -euo pipefail
cd "$(dirname "$0")/.."
for s in org personal; do
  out="prisma/$s/migrations/0001_init/migration.sql"
  mkdir -p "$(dirname "$out")"
  npx prisma migrate diff --from-empty --to-schema-datamodel "prisma/$s/schema.prisma" --script \
    | sed '/^-- CreateSchema$/d; /^CREATE SCHEMA IF NOT EXISTS "public";$/d' > "$out"
done
cat db/checks.sql >> prisma/org/migrations/0001_init/migration.sql
