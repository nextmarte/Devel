#!/bin/sh
set -e

echo "🔄 Aguardando banco de dados..."
until pg_isready -h postgres -p 5432 -U "${DB_USER:-devel_user}" > /dev/null 2>&1; do
  echo "PostgreSQL ainda não está pronto..."
  sleep 2
done

echo "✅ PostgreSQL está pronto!"

echo "🔄 Aguardando Redis..."
until redis-cli -h redis -p 6379 ping > /dev/null 2>&1; do
  echo "Redis ainda não está pronto..."
  sleep 2
done

echo "✅ Redis está pronto!"

echo "🔄 Executando migrações Prisma..."
npx prisma migrate deploy --skip-generate || true

echo "🌱 Executando seed do banco..."
npx prisma db seed || true

echo "🚀 Iniciando aplicação Next.js na porta ${PORT:-8565}..."
exec next start -p ${PORT:-8565}
