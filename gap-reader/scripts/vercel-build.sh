#!/usr/bin/env bash
# Build command for Vercel (see vercel.json and docs/deploy-vercel.md).
#
# Production deployments apply both migrations before building. Preview
# deployments skip migrations unless MIGRATE_ON_BUILD=1, so a preview can
# never change the production database's structure.
set -euo pipefail

missing=()
for v in ORG_DATABASE_URL ORG_DIRECT_DATABASE_URL PERSONAL_DATABASE_URL PERSONAL_DIRECT_DATABASE_URL AUTH_SECRET APP_ENCRYPTION_KEY APP_URL; do
  [ -n "${!v:-}" ] || missing+=("$v")
done
if [ "${VERCEL_ENV:-}" = "production" ] && [ -z "${SMTP_URL:-}" ]; then missing+=("SMTP_URL"); fi
if [ ${#missing[@]} -gt 0 ]; then
  echo "Missing environment variables: ${missing[*]}" >&2
  echo "See docs/deploy-vercel.md." >&2
  exit 1
fi

if [ "${VERCEL_ENV:-}" = "production" ] || [ "${MIGRATE_ON_BUILD:-}" = "1" ]; then
  echo "Applying migrations (org, then personal)."
  npx prisma migrate deploy --schema prisma/org/schema.prisma
  npx prisma migrate deploy --schema prisma/personal/schema.prisma
else
  echo "Skipping migrations on a ${VERCEL_ENV:-non-Vercel} build."
fi

npx next build
