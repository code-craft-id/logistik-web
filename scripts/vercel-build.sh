#!/bin/sh
# Vercel build (vercel.json buildCommand is limited to 256 characters).
# Production only: apply migrations, then optionally bootstrap the first
# admin (BOOTSTRAP_ADMIN=yes, skipped when users exist). Preview never
# touches the database.
set -e
npm exec -- prisma generate
if [ "$VERCEL_ENV" = "production" ]; then
  export DIRECT_URL="${DIRECT_URL:-${DATABASE_NEON_DATABASE_URL_UNPOOLED:-$DATABASE_URL}}"
  # Neon may be asleep (P1001 "Can't reach database server"): retry while it wakes.
  n=1
  until npm exec -- prisma migrate deploy; do
    [ "$n" -ge 5 ] && exit 1
    echo "prisma migrate deploy failed (attempt $n), retrying in 10s"
    n=$((n + 1))
    sleep 10
  done
  if [ "$BOOTSTRAP_ADMIN" = "yes" ]; then
    node scripts/bootstrap-production-admin.mjs
  fi
fi
npm run build
